
# include in the streaming scripts controller
module Plunketts::ScriptsStreaming
  extend ActiveSupport::Concern

  included do
    include ActionController::Live

    skip_before_action :verify_authenticity_token, only: [:exec]

    def save_run?(run)
      raise "Concrete classes must implement save_run?"
    end

    def get_executer
      raise "Subclasses must implement get_executer"
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

      executor = get_executer

      if request_body['field_values']
        executor.set_field_values request_body['field_values']
      end

      run = executor.run response.stream
      save_run? run
    end


  end
end

