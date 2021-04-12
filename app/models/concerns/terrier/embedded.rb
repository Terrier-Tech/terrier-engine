class EmbeddedFieldDef

  attr_accessor :type, :null, :default

  def initialize(args)
    @type = args[:type]
    @null = args[:required] ? false : true
    @default = args[:default]
  end

end


# include this module in classes that are meant to be embedded in other models
module Terrier::Embedded
  extend ActiveSupport::Concern
  include ActiveModel::Validations
  include ActiveModel::Conversion
  extend ActiveModel::Naming

  included do

    def initialize(attrs = {})
      assign_attributes attrs
    end

    def attributes
      hash = {}
      self.class.field_defs.each do |name, opts|
        if opts.type == Integer
          hash[name] = self.send(name).to_i
        elsif opts.type && opts.type < Terrier::Embedded
          hash[name] = self.send(name).map{|o| o.attributes}
        else
          hash[name] = self.send(name)
        end
      end
      hash
    end

    def assign_attributes(attrs)
      attrs.each do |name, value|
        send("#{name}=", value)
      end
    end

    def persisted?
      false
    end


    # creates a string array field and the associated string getter and setter
    # pass downcase: true to force values to be downcased before assigned from _s
    def self.string_array_field(name, options = {})
      downcase = false
      if options[:downcase]
        downcase = true
        options.delete :downcase
      end
      options[:type] = Array
      field name, options
      define_method "#{name}_s" do
        s = self.send(name)
        if s
          s.join(', ')
        else
          ''
        end
      end
      define_method "#{name}_s=" do |s|
        if s
          val = s.split(',').map do |comp|
            if downcase
              comp.strip.downcase
            else
              comp.strip
            end
          end
          self.send "#{name}=", val
        else
          self.send("#{name}=", [])
        end
      end
    end

    # creates a string hash field and the associated string getter and setter
    def self.string_hash_field(name)
      field name, type: Hash
      define_method "#{name}_s" do
        s = self.send(name)
        if s
          s.to_json
        else
          ''
        end
      end
      define_method "#{name}_s=" do |s|
        if s
          val = s
          if s.instance_of? String
            if s.length > 0
              val = JSON.parse s
            else
              val = {}
            end
          end
          self.send("#{name}=", val)
        else
          self.send("#{name}=", {})
        end
      end
    end

    # creates an int array field and the associated string getter and setter
    def self.int_array_field(name, options = {})
      options[:type] = Array
      field name, options
      define_method "#{name}_s" do
        s = self.send(name)
        if s
          s.map{|i| i.to_s}.join(', ')
        else
          ''
        end
      end
      define_method "#{name}_s=" do |s|
        if s
          val = s.split(',').map do |comp|
            comp.strip.to_i
          end
          self.send "#{name}=", val
        else
          self.send("#{name}=", [])
        end
      end
    end

    # creates a time field that can be edited by setting the date string value
    def self.date_field(name, options={})
      options[:type] = Time
      field name, options
      define_method "#{name}_s" do
        d = self.send(name)
        if d
          d.strftime('%Y-%m-%d')
        else
          nil
        end
      end
      define_method "#{name}_s=" do |d|
        if d
          self.send("#{name}=", Time.parse(d))
        else
          self.send("#{name}=", nil)
        end
      end
    end

    # defines a string field that only accepts a fixed set of possible values
    def self.enum_field(name, values)
      field name, type: String, in: values, default: values.first

      # create helper methods for name_value? and name_value!
      values.each do |value|
        define_method("#{name}_#{value}?") { self.send(name) == value }
        define_method("#{name}_#{value}!") { self.send("#{name}=", value) }
      end

      self.define_singleton_method "possible_#{name}_values" do
        values
      end

      options = values.map do |v|
        [v.titleize, v]
      end
      self.define_singleton_method "#{name}_options" do
        options
      end
    end

  end

  module ClassMethods

    def from_attributes(hash)
      hash = ActiveSupport::HashWithIndifferentAccess.new hash
      inst = self.new
      return inst if hash.instance_of? String
      field_defs.each do |name, opts|
        value = hash[name]
        if opts.type == Integer
          inst.send("#{name}=", (value || opts.default).to_i )
        elsif opts.type == Float
          inst.send("#{name}=", (value || opts.default).to_f )
        elsif !opts.type.nil? && opts.type < Terrier::Embedded
          if value.class.name.index 'Hash'
            inst.send("#{name}=", value.values.map{|h| opts.type.from_attributes(h)})
          elsif value.instance_of? Array
            inst.send("#{name}=", value.map{|h| opts.type.from_attributes(h)})
          else
            inst.send("#{name}=", [])
          end
        else
          inst.send("#{name}=", value || opts.default)
        end
      end
      inst
    end

    def field_defs
      unless @fields
        @fields = {}
      end
      @fields
    end

    def fields
      @fields
    end

    def columns_hash
      @fields
    end

    def field(name, opts={})
      attr_accessor name
      field_defs[name] = EmbeddedFieldDef.new(opts)
    end

    def association_metadata
      {}
    end

    def reflections
      {}
    end

    def embeds_many(model_name_plural, options={})
      attr_accessor model_name_plural
      options[:type] = model_name_plural.to_s.singularize.classify.constantize
      field_defs[model_name_plural] = EmbeddedFieldDef.new(options)
    end

  end

end