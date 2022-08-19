require 'terrier/scripts/script_field'
require 'terrier/scripts/script_searcher'
require 'terrier/scripts/script_config'

# include this module in the Script model
module Terrier::ScriptBase
  extend ActiveSupport::Concern
  include Terrier::Fields
  include Terrier::Schedulable


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


    ## Reporting

    enum_field :report_category, Terrier::ScriptConfig.category_icons.keys.map(&:to_s).sort


    ## Runs

    has_many :script_runs, dependent: :destroy


    ## Scheduling

    enum_field :schedule_time, %w(none evening morning)


    ## Visibility

    @visibility_levels = %w(public private)
    enum_field :visibility, @visibility_levels

    ## Email

    def send_email_if_necessary(settings, user, output_files = [], log_url = "")
      verify_settings settings
      if self.email_recipients.present? && settings[:disable] == false
        send_email settings, user, output_files, log_url
      end
    end

    def send_email(settings, user, output_files, log_url)
      raise NotImplementedError
    end

    private

    def verify_settings(settings)
      raise "email_settings file_output #{settings[:file_output]} is not valid" unless %w(attachment link).include? settings[:file_output]
      raise "email_settings disable must be true or false" unless [true, false].include? settings[:disable]
    end

  end

end


