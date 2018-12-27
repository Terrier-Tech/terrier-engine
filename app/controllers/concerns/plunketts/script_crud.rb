require 'parser/current'
require 'plunketts/scripts/script_config'

# include in the regular scripts controller
module Plunketts::ScriptCrud
  extend ActiveSupport::Concern

  included do

    def constants
      render_success "Got Constants", {
          constants: {
            category_options: Plunketts::ScriptConfig.category_options,
            visibility_options: Script.visibility_options,
            schedule_time_options: Script.schedule_time_options,
            month_groups: ScheduleRule.month_groups,
            days: ScheduleRule.days,
            weeks: ScheduleRule.weeks
          }
      }
    end


    def check
      body = params[:body]

      begin
        Parser::CurrentRuby.parse(body)
        render_success 'Successfully parsed script'
      rescue => ex
        Rails.logger.debug "message: #{ex.message}, diagnostic: #{ex.diagnostic}"
        Rails.logger.debug ex.diagnostic.location
        render json: {status: 'Error', message: "Error parsing script: #{ex.message}", diagnostic: ex.diagnostic}
      end
    end


    def compute_field_values
      fields = JSON.parse params[:script_fields_json]
      script = Script.new
      script.script_fields = fields

      values = script.compute_field_values
      options = script.compute_field_options

      render_success 'Successfully Computed Field Values', field_values: values, field_options: options
    end

  end

end
