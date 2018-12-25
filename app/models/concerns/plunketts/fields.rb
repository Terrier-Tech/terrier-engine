module Plunketts::Fields
  extend ActiveSupport::Concern

  module ClassMethods

    ## Embedded Collections

    # creates a string array field and the associated string getter and setter
    # pass downcase: true to force values to be downcased before assigned from _s
    def string_array_field(name, options = {})
      downcase = false
      if options[:downcase]
        downcase = true
        options.delete :downcase
      end
      options[:type] = Array
      options.delete :index
      define_method "#{name}_s" do
        s = self.send(name)
        if s
          s.join(', ')
        else
          ''
        end
      end
      define_method "#{name}_s=" do |s|
        if s && s.length > 0
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
      define_method "clear_#{name}=" do |val|
        if val
          self.send "#{name}=", []
        end
      end
    end

    # creates a hash array field and the associated string getter and setter
    # unlike string_array_field, indexes will not automatically be created on hash arrays
    # you must pass index: true explicitly
    def hash_array_field(name, options = {})
      options[:type] = Array
      options.delete :index
      define_method "#{name}_s" do
        s = self.send(name)
        if s
          s.map(&:to_s).join(', ')
        else
          ''
        end
      end
      define_method "#{name}_s=" do |full_s|
        if full_s && full_s.length > 0
          val = if full_s =~ /^\[/ && full_s =~ /\]$/
                  JSON.parse full_s
                else
                  JSON.parse "[#{full_s}]"
                end
          self.send "#{name}=", val
        else
          self.send("#{name}=", [])
        end
      end
    end

    # creates an int array field and the associated string getter and setter
    def int_array_field(name, default=[])
      define_method "#{name}_s" do
        s = self.send(name)
        if s
          s.join(',')
        else
          ''
        end
      end
      define_method "#{name}_s=" do |s|
        if s
          self.send("#{name}=", s.split(',').map{|comp| comp.strip.to_i})
        else
          self.send("#{name}=", [])
        end
      end
    end

    # creates a string hash field and the associated string getter and setter
    def string_hash_field(name, options={})
      options[:type] = Hash
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

    # creates a field containing an integer cents value, as well as dollars accessors
    def cents_field(name, options={})
      options[:type] = Integer
      field name, options
      define_method "#{name}_dollars" do
        c = self.send(name)
        if c
          '%.2f' % (c.to_f / 100.0)
        else
          nil
        end
      end
      define_method "#{name}_dollars=" do |d|
        if d
          self.send("#{name}=", (d.to_f * 100.0).round)
        else
          self.send("#{name}=", nil)
        end
      end
    end

    # creates a time field that can be edited by setting the date string value
    def date_field(name, options={})
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
          self.send("#{name}=", Chronic.parse(d))
        else
          self.send("#{name}=", nil)
        end
      end
    end

    # defines a string field that only accepts a fixed set of possible values
    # pass optional: true for the value to be optional
    def enum_field(name, values, options={})
      inclusion_options = {
          in: values,
          message: "'%{value}' is not a valid #{name} value"
      }
      if options[:optional]
        inclusion_options[:allow_blank] = true
        inclusion_options[:allow_nil] = true
      end
      validates name, inclusion: inclusion_options

      # create helper methods for name_value? and name_value!
      values.each do |value|
        define_method("#{name}_#{value}?") { self.send(name) == value }
        define_method("#{name}_#{value}!") { self.send("#{name}=", value) }
      end

      self.define_singleton_method "possible_#{name}_values" do
        values
      end

      select_options = values.map do |v|
        [v.smart_title, v]
      end
      if options[:optional]
        select_options = [['', nil]] + select_options
      end
      self.define_singleton_method "#{name}_options" do
        select_options
      end
    end
  end

end