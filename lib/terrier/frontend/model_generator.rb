require 'terrier/frontend/base_generator'

# Generates the models.ts and schema.ts files from the database schema.
class ModelGenerator < BaseGenerator

  # @param options [Hash] a hash of options for generating the model
  # @option options [Hash{String => Array<String>}] :imports a hash of import paths to a list of symbols
  # @option options [Hash{String => String}] :type_map a hash of type names to map to other names
  # @option options [String, Array<String>] :prefix model name prefix(s) used to select the included models
  # @option options [String, Array<String>] :exclude_prefix model name prefix(s) used to reject out the excluded models
  def initialize(options={})
    super
    @has_shrine = defined?(Shrine)

    @imports = options[:imports] || {}
    @type_map = options[:type_map] || {}
    @prefix = Array.wrap(options[:prefix])
    @exclude_prefix = Array.wrap(options[:exclude_prefix])

    # add the default imports
    @imports['tuff-core/types'] ||= []
    @imports['tuff-core/types'] << 'OptionalProps'
  end

  def each_model
    ApplicationRecord.descendants.each do |model|
      next if model.respond_to?(:exclude_from_frontend?) && model.exclude_from_frontend? # we don't need these on the frontend
      next if @prefix.present? && !@prefix.any? { |prefix| model.name.start_with?(prefix) } # filter by prefix
      next if @exclude_prefix.present? && @exclude_prefix.any? { |prefix| model.name.start_with?(prefix) } # filter by exclude prefix
      yield model
    end
  end

  def run
    # load all model metadata
    Rails.application.eager_load!
    models = {}
    each_model do |model|
      reflections = model.reflections
      if (reflections_to_exclude = model.try(:exclude_reflections_from_frontend).presence)
        reflections = reflections.except *reflections_to_exclude
      end

      columns = model.columns
      if (columns_to_exclude = model.try(:exclude_columns_from_frontend).presence)
        columns = columns.reject { _1.name.in? columns_to_exclude }
      end

      column_names = Set.new columns.map(&:name)
      enum_fields = model.validators.each_with_object({}) do |validator, enum_fields|
        column, *other_columns = validator.attributes
        values = validator.options[:in]
        if !other_columns.present? && column.to_s.in?(column_names) && values.present? && !values.is_a?(Proc)
          # if values is a proc, the values aren't known at compile time and shouldn't be included in the typescript type
          enum_fields[column] = values
        end
      end

      models[model.name] = {
        columns:,
        reflections:,
        belongs_tos: reflections.select { |_, ref| model.column_names.include?("#{ref.name}_id") },
        has_manies: reflections.select { |_, ref| ref.class_name.classify.constantize.column_names.include?("#{model.model_name.singular}_id") },
        enum_fields:,
        attachments: @has_shrine ? model.ancestors.grep(Shrine::Attachment).map(&:attachment_name) : [],
        model_class: model,
        table_name: model.table_name
      }
    end

    #noinspection RubyUnusedLocalVariable
    unpersisted_columns = %w[id created_at created_by_name updated_at _state]

    # generate and format the models file
    out_path = render_template 'models.ts', binding
    info "Wrote #{models.count.to_s.bold} models to #{out_path.blue}"
    prettier_file out_path
  end

  def process_raw_model(model)
    # remove the columns metadata so that they can be placed in the relevant column definitions
    model_meta = model[:metadata] || {}
    columns_meta = model_meta.delete(:columns).presence || {}

    # split out the reflections
    refs = model.delete :reflections
    belongs_to = {}
    has_many = {}
    refs.each do |ref_name, ref|
      ref_type = ref.options[:class_name].presence || ref.name.to_s.classify
      next if ref_type.constantize.exclude_from_frontend?
      raw_ref = {
        name: ref_name,
        model: ref_type
      }
      if model[:columns].map(&:name).include?("#{ref.name}_id")
        raw_ref[:optional] = ref.options[:optional] || false
        belongs_to[ref_name] = raw_ref
      elsif ref_type.constantize.column_names.include?("#{model[:table_name].singularize}_id")
        has_many[ref_name] = raw_ref
      end
    end
    model[:belongs_to] = belongs_to
    model[:has_many] = has_many

    columns_to_exclude = model[:excluded_columns] || Set.new
    info "Excluding #{columns_to_exclude.count} #{model[:name]} columns: #{columns_to_exclude.to_a.join(', ')}"

    # make the columns into a map
    raw_cols = {}
    model[:columns].each do |col|
      next if col.name.in?(columns_to_exclude)

      enum_field = model[:enum_fields][col.name.to_sym]
      type = enum_field ? 'enum' : model[:type_map][col.name.to_sym] || col.type
      raw_col = {
        name: col.name,
        nullable: col.null,
        type: type
      }

      # get column metadata
      col_meta = columns_meta[col.name.to_sym]
      if col_meta
        raw_col[:metadata] = col_meta
      end

      # is it an array?
      if col.sql_type_metadata.sql_type.ends_with?('[]')
        raw_col[:array] = true
      end

      # is it an enum?
      if enum_field
        raw_col[:possible_values] = enum_field.is_a?(Proc) ? enum_field.call : enum_field
      end
      raw_cols[col.name] = raw_col
    end
    model[:columns] = raw_cols
  end

  # @return [Hash] a raw representation of the schema
  def raw_schema
    models = load_models
    models.each do |_, model|
      process_raw_model model
    end
    {
      models: models
    }
  end

  # Load all model metadata
  # @return [Hash] a hash mapping model name to its metadata
  def load_models
    Rails.application.eager_load!
    models = {}
    each_model do |model|
      enum_fields = {}
      model.validators.each do |v|
        if v.options[:in].present? && v.attributes.length == 1
          enum_fields[v.attributes.first] = v.options[:in]
        end
      end
      attachments = @has_shrine ? model.ancestors.grep(Shrine::Attachment).map(&:attachment_name) : []
      models[model.name] = {
        columns: model.columns,
        reflections: model.reflections,
        enum_fields: enum_fields,
        attachments: attachments,
        name: model.name,
        table_name: model.table_name,
        type_map: model.type_map || {},
        excluded_columns: model.exclude_columns_from_frontend,
        metadata: model.respond_to?(:metadata) ? model.metadata : nil
      }
    end
    models
  end

  def build_typescript_model_type(model_name, model, is_unpersisted = false)
    unnamespaced_model_name = model_name.split('::').last
    type_str = "#{unnamespaced_model_name} = { "
    model_class = model[:model_class]

    fields = []
    columns = model[:columns]

    enum_dependency_strings = []
    if model_class.enum_dependencies
      model_class.enum_dependencies.each do |dep_field, deps|
        used_enum_values = []
        deps.each do |enum_val, required_field|
          enum_type_str = <<~TS
            ({#{dep_field}: '#{enum_val}'; #{required_field}: #{typescript_type(model_class.columns_hash[required_field.to_s], model_class)}} 
          TS

          remaining_enum_values = model[:enum_fields][dep_field] - [enum_val.to_s]

          enum_type_str += <<~TS 
            | {#{dep_field}: #{remaining_enum_values.map { |v| "'#{v}'" }.join(' | ')}; #{typescript_field(model_class.columns_hash[required_field.to_s], model_class)}})
          TS

          enum_dependency_strings.push enum_type_str.strip

          columns.delete dep_field
          columns.delete required_field
        end
      end
    end

    # columns
    columns.each do |col|
      next if model[:attachments].include?(col.name.to_sym)
      fields.push typescript_field(col, model_class, model[:enum_fields][col.name.to_sym], is_unpersisted)
    end

    # reflections (associations)
    model[:reflections].each do |ref_name, ref|
      ref_type = compute_ref_type(ref)
      next unless ref_type
      if is_unpersisted && ref_type.include?('[]')
        fk = ref.options[:foreign_key].presence || "#{model_name.tableize.singularize}_id"
        if ref.class_name.classify.constantize.column_names.include?(fk)
          ref_type = "OptionalProps<Unpersisted#{ref_type.gsub('[]', '')},'#{fk}'>[]"
        end
      end
      fields.push "#{ref_name}?: #{ref_type}"
    end

    # attachments
    model[:attachments].each do |attachment|
      fields.push "#{attachment}?: File"
    end

    type_str += fields.join(', ') + " }"
    if enum_dependency_strings.present?
      type_str += " & #{enum_dependency_strings.join(' & ')}"
    end
    type_str
  end

  def typescript_field(col, model_class, enum_fields = nil, is_unpersisted = false)
    str = col.name

    if is_unpersisted
      str += col.null || %w[id created_at created_by_name updated_at _state].include?(col.name) ? '?' : ''
    else
      str += col.null ? '?' : ''
    end
    str += ': ' + typescript_type(col, model_class, enum_fields)
    str
  end

  # @return [String] the typescript type associated with the given column type
  def typescript_type(col, model_class, enum_fields = nil)
    if model_class.respond_to?(:embedded_fields)
      embedded = model_class.embedded_fields[col.name.to_sym]
      if embedded.present?
        embedded_type = embedded_schema_type(embedded[:type])
        return case embedded[:kind].to_sym
          when nil, :one then embedded_type
          when :many then "#{embedded_type}[]"
          else raise "Unknown embedded kind: #{embedded[:kind].inspect}"
          end
      end
    end

    schema_method = "#{col.name}_schema"
    if model_class.respond_to?(schema_method)
      schema = model_class.send(schema_method)
      if schema.present?
        return typescript_schema_type(schema)
      end
    end

    case col.type
    when :boolean, :bool
      'boolean'
    when :integer, :float
      'number'
    when :json, :jsonb
      if @has_shrine && model_class && model_class.ancestors.grep(Shrine::Attachment).map { |anc| "#{anc.attachment_name}_data" }.include?(col.name)
        'Attachment | { path: string }'
      else
        'object'
      end
    else
      if enum_fields.present?
        enum_fields.map { |f| "'#{f}'" }.join(' | ')
      elsif col.sql_type_metadata.sql_type == 'text[]'
        'string[]'
      else
        'string'
      end
    end
  end

  # @return [String] the typescript type associated with the given
  # schema literal returned from a `*_schema` method on a model
  def typescript_schema_type(type)
    case type
    when Hash
      type_str = StringIO.new
      type_str << '{ '
      last_key = type.keys.count - 1
      type.keys.each_with_index do |key, i|
        type_str << key
        type_str << ': '
        type_str << typescript_schema_type(type[key])
        if i < last_key
          type_str << ', '
        end
      end
      type_str << ' }'
      type_str.string
    when :integer, :float
      'number'
    when :json, :jsonb
      'object'
    else
      type
    end
  end

  # returns a schema string for the embedded model type
  # @param embedded_type [Terrier::Embedded]
  # @return [String]
  def embedded_schema_type(embedded_type)
    type_hash = {}
    embedded_type.field_defs.each do |name, opts|
      next if opts.type.nil?

      type_hash[name] = ruby_type_to_typescript(opts.type, opts)
    end

    typescript_schema_type(type_hash)
  end

  def ruby_type_to_typescript(type, opts = nil)
    if type < Terrier::Embedded
      embedded_schema_type(type)
    elsif type < Numeric
      'number'
    elsif type < Hash
      'Record<unknown, unknown>'
    elsif [String, Time].include?(type)
      'string'
    elsif type == Array
      if opts.nil? || opts.element_type.nil?
        'unknown[]'
      else
        "#{ruby_type_to_typescript(opts.element_type)}[]"
      end
    else
      type
    end
  end

  # @param ref [ActiveRecord::Reflection] a HasMany or BelongsTo reflection
  # @return [String] the typescript type of the given reflection
  def compute_ref_type(ref)
    t = ref.options[:class_name].presence || ref.name.to_s.classify
    begin
      if t.constantize.exclude_from_frontend?
        return nil
      end
    end
    if @type_map[t]
      t = @type_map[t]
    else
      t
    end
    is_array_type = !(ref.is_a?(ActiveRecord::Reflection::ThroughReflection) && ref.through_reflection.is_a?(ActiveRecord::Reflection::BelongsToReflection)) &&
                    (ref.is_a?(ActiveRecord::Reflection::HasManyReflection) || ref.is_a?(ActiveRecord::Reflection::ThroughReflection))

    t += "[]" if is_array_type
    t
  end

end