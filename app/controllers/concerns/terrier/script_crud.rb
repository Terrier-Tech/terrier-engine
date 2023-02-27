require 'parser/current'
require 'terrier/scripts/script_config'

# include in the regular scripts controller
module Terrier::ScriptCrud
  extend ActiveSupport::Concern

  included do

    def constants
      render_success "Got Constants", {
          constants: {
            category_options: Terrier::ScriptConfig.category_options,
            report_type_options: Terrier::ScriptConfig.report_type_options,
            visibility_options: Script.visibility_options,
            schedule_time_options: Script.schedule_time_options,
            field_type_options: ScriptField.field_type_options,
            fields_help: Terrier::ScriptConfig.fields_help,
            month_groups: ScheduleRule.month_groups,
            hours: ScheduleRule.hours,
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

      override_fields script, values, options

      render_success 'Successfully Computed Field Values', field_values: values, field_options: options
    end

    # subclasses can implement this to override the values and options
    def override_fields(script, values, options)
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

    # Returns a json response containing an array of action log entries
    # The entity changes should already be formatted
    def action_log
      raise "Subclasses must override action_log!"
    end

    def clear_run
      begin
        script = Script.find params[:script_id]
        run = script.script_runs.where(id: params[:run_id]).first
        unless run
          raise "No script run with id #{params[:run_id]}"
        end
        unless run.status == 'running'
          raise "Run has status '#{run.status}', so can't be cleared!"
        end
        run.status = 'cleared'
        save_run? run
        render_success "Marked run as cleared", run: run
      rescue => ex
        render_exception ex
      end
    end


    def save_script?(script)
      raise "Concrete classes must implement save_script?"
    end

    def save_run?(script)
      raise "Concrete classes must implement save_run?"
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
    ,case when a.schedule_hour = 'null' then null else a.schedule_hour end as schedule_hour
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
      s.schedule_hour,
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
order by a.updated_at DESC
SQL
    end


    def search_results
      key = params[:key]
      query = params[:query]
      begin
        searcher = ScriptSearcher.new
        result = searcher.search query
        scripts = Script.where(_state: 0).where("id IN #{result.ids.to_postgres_array}")
        render_success "Found #{scripts.count} scripts", {scripts: scripts, key: key, elapsed_time: result.took, total: result.total}
      rescue => ex
        render_exception ex
      end

    end


    def script_params
      params[:script].permit!
    end

  end

end
