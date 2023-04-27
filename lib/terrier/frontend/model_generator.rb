require 'terrier/frontend/base_generator'

class ModelGenerator < BaseGenerator

  # @param options [Hash] a hash of options for generating the model
  # @option options [Hash<String,Array<String>>] :imports A hash of import paths to a list of symbols
  def initialize(options={})
    super
    @has_shrine = defined?(Shrine)

    @imports = options[:imports] || {}

    # add the default imports
    @imports['tuff-core/types'] ||= []
    @imports['tuff-core/types'] << 'OptionalProps'
  end

  def run
    # load all model metadata
    Rails.application.eager_load!
    models = {}
    ApplicationRecord.descendants.each do |model|
      next if model.respond_to?(:exclude_from_frontend?) && model.exclude_from_frontend? # we don't need these on the frontend
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
        model_class: model
      }
    end

    #noinspection RubyUnusedLocalVariable
    unpersisted_columns = %w[id created_at created_by_name updated_at _state]

    # generate the models file
    out_path = render_template 'models.ts', binding
    info "Wrote #{models.count.to_s.bold} models to #{out_path.blue}"
  end

  # return the typescript type associated with the given column type
  def typescript_type(col, model_class, enum_fields = nil)
    case col.type
    when :integer, :float
      'number'
    when :json, :jsonb
      schema_method = "#{col.name}_schema"
      if model_class.respond_to?(schema_method)
        schema = model_class.send(schema_method)
        if schema.present?
          _typescript_type(schema)
        else
          'object'
        end
      elsif @has_shrine && model_class.ancestors.grep(Shrine::Attachment).map { |anc| "#{anc.attachment_name}_data" }.include?(col.name)
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

  def _typescript_type(type)
    case type
    when Hash
      type_str = StringIO.new
      type_str << "{ "
      last_key = type.keys.count - 1
      type.keys.each_with_index do |key, i|
        type_str << key
        type_str << ": "
        type_str << _typescript_type(type[key])
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
      'string'
    end
  end

end