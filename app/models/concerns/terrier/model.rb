class ValidationError < StandardError

  attr_reader :errors

  def initialize(message, errors)
    super message
    @errors = errors
  end
end

module Terrier::Model
  extend ActiveSupport::Concern

  included do

    ## Upserting (Instance Methods)

    # called after the record and all of its provided relations have been upserted
    def after_upsert!(change_user)
      nil
    end

  end


  module ClassMethods

    ## Fields

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

    # creates accessors name_s, name_s=, and safe_name
    # safe_name returns default if the value isn't present
    # @param default [Hash,Array] the default value to return from safe_name if the value is nil
    # @param schema [Hash] an optional hash defining what the expected shape of the data is
    def self.json_field(name, default = {}, schema = nil)
      self.define_method "#{name}_s" do
        self[name]&.to_json || default.to_json
      end
      self.define_method "#{name}_s=" do |s|
        if s.nil?
          self[name] = nil
        else
          self[name] = JSON.parse s
        end
      end
      self.define_method "safe_#{name}" do
        val = self[name]
        if val.nil?
          default
        elsif val.is_a? String
          JSON.parse val
        else
          val
        end
      end
      if schema
        self.define_singleton_method "#{name}_schema" do
          schema.dup
        end
      end
    end


    ## Frontend

    def exclude_from_frontend!
      @_exclude_from_frontend = true
    end

    def exclude_from_frontend?
      @_exclude_from_frontend
    end


    ## Upserting (Class Methods)

    # subclasses can override this to provide a list of columns by which
    # upsert! should search for existing matching records
    def upsert_columns
      []
    end

    def find_or_new_upsert_record(attrs)
      id = attrs.delete 'id'
      if id.present?
        record = self.find id
      else
        cols = self.upsert_columns
        if cols.present?
          clause = {}
          cols.each do |c|
            clause[c] = attrs[c]
          end
          record = self.where(clause).first
        end
        record ||= self.new
      end
      record
    end

    # Upserts the model with given attributes and recursively upserts all associated has-manies and belongs-tos
    # included in attrs
    def upsert!(attrs, change_user, includes = {})
      record = find_or_new_upsert_record(attrs)

      includes_from_attrs(attrs, includes)
      has_manies = remove_has_manies attrs
      belongs_tos = remove_belongs_tos attrs
      attrs.delete 'created_at'
      attrs.delete 'updated_at'
      record.assign_attributes attrs
      unless record.valid?
        raise ValidationError.new("#{self.name} is not valid", record.errors)
      end

      upsert_belongs_tos! record, belongs_tos, change_user
      if record.changed?
        record.save_by_user! change_user
      end
      upsert_has_manies! record, has_manies, change_user

      record.after_upsert! change_user

      # reload the record to ensure we have the latest values from the db.
      record.reload
    end

    # given an attrs hash, produce a nested hash of relations included in the attrs
    def includes_from_attrs(attrs, includes = {})
      self.reflections.each do |name, ref|
        next unless attrs.has_key?(name) && attrs[name].present?
        model = ref.class_name.constantize

        includes[name] ||= {}
        if ref.class == ActiveRecord::Reflection::HasManyReflection
          attrs[name].each do |other_attrs|
            model.includes_from_attrs(other_attrs, includes[name])
          end
        else
          model.includes_from_attrs(attrs[name], includes[name])
        end
      end
      nil
    end

    # removes all associated has-many records from the attributes hash
    # and store them in a hash for later use by upsert_has_manies!
    def remove_has_manies(attrs)
      has_manies = {}
      self.reflections.each do |name, ref|
        if ref.class == ActiveRecord::Reflection::HasManyReflection && attrs[name].present?
          records = attrs.delete(name)
          raise "#{name} is a #{records.class.name}, not an array" unless records.is_a?(Array)
          has_manies[name] = {
            records: records,
            model: ref.class_name.constantize,
            inverse_foreign_key: ref.inverse_of&.foreign_key || "#{self.model_name.singular}_id"
          }
        end
      end
      has_manies
    end

    # upserts the associated has-many records retrieved by remove_has_manies
    def upsert_has_manies!(record, has_manies, change_user)
      has_manies.each do |_, ref|
        other_model = ref[:model]
        ref[:records].map do |other|
          other[ref[:inverse_foreign_key]] = record.id
          other_model.upsert! other, change_user
        end
      end
    end

    # Removes all associated belongs-to records from the attributes hash
    # and store them in a hash for later use by upsert_belongs_tos
    def remove_belongs_tos(attrs)
      belongs_tos = {}
      self.reflections.each do |name, ref|
        if ref.class == ActiveRecord::Reflection::BelongsToReflection && attrs[name].present?
          belongs_tos[name] = {
            record: attrs.delete(name),
            model: ref.class_name.constantize,
            foreign_key: ref.foreign_key,
          }
        end
      end
      belongs_tos
    end

    # Upserts the associated belongs-to records retrieved by remove_belongs_tos
    def upsert_belongs_tos!(record, belongs_tos, change_user)
      belongs_tos.each do |_, ref|
        other_model = ref[:model]
        other_attrs = ref[:record]

        other = other_model.upsert! other_attrs, change_user
        record[ref[:foreign_key]] = other.id
      end
    end

    def safe_record_errors(ex, record)
      if ex.is_a? ValidationError
        ex.errors
      elsif record&.errors&.present?
        record.errors
      else
        { base: [ex.message] }
      end
    end


  end

end