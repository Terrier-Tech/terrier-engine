require 'terrier/frontend/base_generator'

# Generates the models.ts and schema.ts files from the database schema.
class ModelGenerator < BaseGenerator

  # @param options [Hash] a hash of options for generating the model
  # @option options [Hash<String,Array<String>>] :imports a hash of import paths to a list of symbols
  # @option options [Hash<String,String>] :type_map a hash of type names to map to other names
  # @option options [String] :prefix a model name prefix used to select the included models
  # @option options [String] :exclude_prefix a model name prefix used to reject out the excluded models
  def initialize(options={})
    super
    @has_shrine = defined?(Shrine)

    @imports = options[:imports] || {}
    @exclude_prefix = options[:exclude_prefix].presence
    @prefix = options[:prefix].presence
    @type_map = options[:type_map] || {}

    # add the default imports
    @imports['tuff-core/types'] ||= []
    @imports['tuff-core/types'] << 'OptionalProps'
  end

  def each_model
    ApplicationRecord.descendants.each do |model|
      next if model.respond_to?(:exclude_from_frontend?) && model.exclude_from_frontend? # we don't need these on the frontend
      next if @prefix && !model.name.start_with?(@prefix) # filter by prefix
      next if @exclude_prefix && model.name.start_with?(@exclude_prefix) # filter by exclude prefix
      yield model
    end
  end

  def run
    # load all model metadata
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
      columns_to_exclude = model.try(:exclude_columns_from_frontend) || Set.new
      models[model.name] = {
        columns: model.columns.reject { |c| c.name.in?(columns_to_exclude) },
        reflections: model.reflections,
        belongs_tos: model.reflections.select { |_, ref| model.column_names.include?("#{ref.name}_id") },
        has_manies: model.reflections.select { |_, ref| ref.class_name.classify.constantize.column_names.include?("#{model.model_name.singular}_id") },
        enum_fields: enum_fields,
        attachments: attachments,
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

    # make the columns into a map
    raw_cols = {}
    model[:columns].each do |col|
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
        raw_col[:possible_values] = enum_field
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
        metadata: model.respond_to?(:metadata) ? model.metadata : nil
      }
    end
    models
  end

  # @return [String] the typescript type associated with the given column type
  def typescript_type(col, model_class, enum_fields = nil)
    case col.type
    when :boolean, :bool
      'boolean'
    when :integer, :float
      'number'
    when :json, :jsonb
      schema_method = "#{col.name}_schema"
      if model_class.respond_to?(schema_method)
        schema = model_class.send(schema_method)
        if schema.present?
          typescript_schema_type(schema)
        else
          'object'
        end
      elsif @has_shrine && model_class && model_class.ancestors.grep(Shrine::Attachment).map { |anc| "#{anc.attachment_name}_data" }.include?(col.name)
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
      type_str << "{ "
      last_key = type.keys.count - 1
      type.keys.each_with_index do |key, i|
        type_str << key
        type_str << ": "
        type_str << typescript_schema_type(type[key])
        if i < last_key
          type_str << ", "
        end
      end
      type_str << " }"
      type_str.string
    when :integer, :float
      'number'
    when :json, :jsonb
      'object'
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
    if ref.class == ActiveRecord::Reflection::HasManyReflection
      t = "#{t}[]"
    end
    t
  end

end