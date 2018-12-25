# include this module in classes that embed other models
module Plunketts::Embedder
  extend ActiveSupport::Concern

  included do

    @embedded_fields = {}

  end

  module ClassMethods

    def embedded_fields
      unless @_embedded_fields
        @_embedded_fields = {}
      end
      @_embedded_fields
    end

    def embeds_many(model_name_plural, options={})
      model_name = model_name_plural.to_s.singularize
      model = (options[:class_name] || model_name.classify).constantize
      field_name = model_name_plural.to_s

      embedded_fields[model_name_plural] = {
          name: model_name_plural,
          type: model
      }

      define_method field_name do
        (super() || []).map do |h|
          if h.is_a? String
            model.from_string(h)
          else
            model.from_attributes(h)
          end
        end
      end

      define_method "#{field_name}=" do |vals|
        if vals.class.name.index('Hash')
          vals = vals.to_hash.values
        elsif vals.instance_of?(String)
          if vals.length > 0
            vals = JSON.parse vals
          else
            vals = []
          end
        end
        values = if vals
                   vals.map do |obj|
                     if obj.respond_to? :attributes
                       obj.attributes
                     else
                       obj
                     end
                   end
                 else
                   []
                 end
        super values
      end

      # for compatibility with old sync
      define_method "#{field_name}_array" do
        self.send field_name
      end

      define_method "#{field_name}_array=" do |array|
        self.send "#{field_name}=", array
      end

      define_method "#{model_name_plural}_json" do
        self.send(model_name_plural).to_json
      end

      define_method "#{model_name_plural}_json=" do |json|
        self.send("#{model_name_plural}=", JSON.parse(json))
      end

    end
  end

end