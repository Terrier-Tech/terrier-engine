
# include in the streaming scripts controller
module Terrier::ScriptsStreaming
  extend ActiveSupport::Concern

  included do
    include ActionController::Live

    skip_before_action :verify_authenticity_token, only: [:exec]

    def save_run?(run)
      raise "Concrete classes must implement save_run?"
    end

    def get_executor
      raise "Subclasses must implement get_executor"
    end

    def exec
      response.headers['Content-Type'] = 'text/event-stream'
      @script = if params[:id]
                  Script.find params[:id]
                else
                  Script.new
                end
      request_body = JSON.parse(request.body.read)
      @script.body = request_body['body']
      run = nil
      t = Time.now
      executor = nil

      # make sure the script isn't running
      if @script.persisted?
        active_run = @script.script_runs.where(_state: 0, status: 'running').first
        if active_run
          message = "This script is already running by #{active_run.created_by_name} on #{active_run.created_at.strftime('%m/%d/%y')} at #{active_run.created_at.strftime('%l:%M %p')}"
          content = [
            {
              type: 'error',
              body: message
            }
          ]
          Rails.logger.warn "== not executing script #{@script}: #{message}"
          response.stream.write content.to_json
          response.stream.close
          return
        end
      end

      begin
        executor = get_executor

        if request_body['field_values']
          executor.set_field_values request_body['field_values']
        end

        # initialize the run
        run = executor.init_run

        # save the run before actually running to mark it as running such that no one else
        save_run? run if @script.persisted?

        # actually run the script
        executor.run run, response.stream

        # now save it again since the run has been completed
        save_run? run if @script.persisted?

      rescue => ex
        is_cancelled = ex.message.index('client disconnected')

        if is_cancelled
          Rails.logger.info "=== Cancelled script run for script #{@script.id} (#{@script.title})"
        else
          # if an error happens at this level, we can't send it in the response since it's already been written its stream
          Rails.logger.warn "=== Error executing script #{@script.id}: #{ex.message}"
          ex.backtrace.each do |line|
            Rails.logger.warn line
          end
        end

        # update the run status if it's been created
        if run&.persisted?
          # write the log
          run.write_log(executor&.log_lines&.join("\n") || "No Output")

          if is_cancelled
            run.status = 'cancelled'
          else
            run.status = 'error'
            run.exception = ex.message if run.respond_to? :exception
            run.backtrace = ex.backtrace.join("\n") if run.respond_to? :backtrace
          end
          run.duration = Time.now - t
          save_run? run
        end
      end
    end


  end
end

