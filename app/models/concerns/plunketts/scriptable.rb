require 'plunketts/engine/scripts/script_field'

# include this module in the script model
module Plunketts::Scriptable
  extend ActiveSupport::Concern
  include Plunketts::Fields
  include Plunketts::Embedder


  included do

    ## Columns

    validates :title, presence: true

    validates :body, presence: {allow_blank: true}


    ## E-Mail

    string_array_field :email_recipients


    ## Fields

    embeds_many :script_fields

    def compute_field_values(raw_values={})
      values = {}
      self.script_fields.each do |field|
        if field.is_a? Hash
          field = ScriptField.new field
        end
        raw_value = raw_values[field.name] || field.default_value
        values[field.name] = ScriptField.compute_value field.field_type, raw_value
      end
      values
    end

    def compute_field_options
      options = {}
      self.script_fields.each do |field|
        if field.is_a? Hash
          field = ScriptField.new field
        end
        options[field.name] = field.compute_options
      end
      options
    end



    ## Searching

    def update_search_index
      if self._state == 0
        ScriptSearcher.new.index self
      else
        self.remove_search_index
      end
    end

    after_save :update_search_index

    def remove_search_index
      begin
        ScriptSearcher.new.unindex self
      rescue => ex
        Rails.logger.warn "Error removing script #{self.id} from search index: #{ex.message}"
      end
    end

    after_destroy :remove_search_index



  end

end


