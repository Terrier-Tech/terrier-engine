# include this module in classes that embed other models
module Terrier::Embedder
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

    def embeds_one(model_name, options={})

      model = (options[:class_name] || model_name.to_s.classify).constantize
      field_name = model_name.to_s

      embedded_fields[model_name] = {
        name: model_name,
        type: model
      }

      define_method field_name do
        val = super()
        if val.is_a? String
          val = val.length>0 ? JSON.parse(val) : nil
        end
        if val.blank?
          nil # may want to have this return a new, but empty instance of the embeded model?
        elsif val.is_a? String
          model.from_string(val)
        else
          model.from_attributes(val)
        end
      end

      define_method "#{field_name}=" do |val|
        if val.present?
          if val.class.name.index('Hash')
            val = val.to_hash.values
          elsif val.instance_of?(String)
            val = JSON.parse(val)
          end
        end
        val = val.attributes if val.respond_to? :attributes
        super val
      end

    end

    def embeds_many(model_name, options={})

      model = (options[:class_name] || model_name.to_s.classify).constantize
      field_name = model_name.to_s

      embedded_fields[model_name] = {
        name: model_name,
        type: model
      }

      define_method field_name do
        val = super() || []
        if val.is_a? String
          val = val.length>0 ? JSON.parse(val) : []
        end
        val.map do |h|
          if h.is_a? String
            model.from_string(h)
          else
            model.from_attributes(h)
          end
        end
      end

      define_method "#{field_name}=" do |vals|
        if vals.nil?
          return super []
        elsif vals.class.name.index('Hash')
          vals = vals.to_hash.values
        elsif vals.instance_of?(String)
          if vals.present?
            vals = JSON.parse(vals)
          else
            vals = []
          end
        end
        return super [] unless vals.present?
        values = vals.map do |obj|
          if obj.respond_to? :attributes
            obj.attributes
          else
            obj
          end
        end
        super values
      end

      # for compatibility with old sync
      define_method("#{field_name}_array") { self.send field_name }
      define_method("#{field_name}_array=") { |array| self.send "#{field_name}=", array }
      define_method("#{model_name}_json") { self.send(model_name).to_json }
      define_method("#{model_name}_json=") { |json| self.send("#{model_name}=", JSON.parse(json)) }

    end

  end

end