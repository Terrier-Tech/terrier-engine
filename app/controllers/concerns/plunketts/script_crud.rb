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
            field_type_options: ScriptField.field_type_options,
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


    def show
      @script = Script.find params[:id]
      render_success "Showing script #{@script.title}", script: @script
    end


    def runs
      begin
        script = Script.find params[:script_id]
        runs = script.script_runs.where(_state: 0).order(created_at: :desc)
        render_success "Got #{runs.count} runs", {runs: runs.as_json(methods: %i(log_url))}
      rescue => ex
        render_exception ex
      end
    end


    def save_script?(script)
      raise "Concrete classes must implement save_script?"
    end

    def create
      begin
        @script = Script.new script_params
        if save_script? @script
          render_success "Created Script", script: @script
        else
          render_error "Error Creating Script", script: @script, errors: @script.errors
        end
      rescue => ex
        render_exception ex
      end
    end

    def update
      begin
        @script = Script.find params[:id]
        @script.assign_attributes script_params
        if save_script? @script
          render_success "Updated Script", script: @script
        else
          render_error "Error Updating Script", script: @script, errors: @script.errors
        end
      rescue => ex
        render_exception ex
      end
    end


    def list_query(user_id)
      created_by_clause = user_id ? "or s.created_by_id = '#{user_id}'" : ''
      <<SQL
select
    a.created_by_name
    ,a.id
    ,a.created_at
    ,a.updated_at
    ,a.report_category
    ,a.title
    ,a.visibility
    ,a.schedule_rules
    ,a.schedule_rule_summaries
    ,a.schedule_time
    ,a.email_recipients
    ,case when b.num_runs is null then 0 else b.num_runs end as num_runs
    ,b.last_run
FROM
  (
    SELECT
      s.id,
      s.created_by_name,
      s.created_at,
      s.updated_at,
      s.report_category,
      s.title,
      s._state,
      s.visibility,
      s.schedule_rules,
      s.schedule_rule_summaries,
      s.schedule_time,
      s.email_recipients
    FROM
      scripts s
    WHERE
      s._state = 0 and 
      (s.visibility = 'public' #{created_by_clause})

  ) a

left outer JOIN
  (
    SELECT
      s.id,
      count(sr.id)       AS num_runs,
      max(sr.created_at) AS last_run
    FROM
      script_runs sr,
      scripts s
    WHERE
      sr.script_id = s.id
      AND s._state = 0
    GROUP BY s.id
  ) b
  on a.id = b.id
order by a.report_category, a.title
SQL
    end


    def script_params
      params[:script].permit!
    end

  end

end
