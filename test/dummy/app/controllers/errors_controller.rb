class ErrorsController < ApplicationController

  def show
    begin
      env = request.env
      @ex = env['action_dispatch.exception']
      @backtrace = @ex.backtrace.map do |line|
        line = line.gsub(Dir.home, '~') # remove the home directory
        if line.index '/gems/' # remove the long gems path
          line = 'gems/' + line.split('/gems/').last
        end
        line
      end
      @status = ActionDispatch::ExceptionWrapper.new(env, @ex).status_code

      @details = {
        path: env['REQUEST_PATH'],
        method: env['REQUEST_METHOD'],
        message: @ex.message,
        status: @status,
        response: ActionDispatch::ExceptionWrapper.rescue_responses[@ex.class.name],
        params: env['action_dispatch.request.parameters'],
        session: env['action_dispatch.request.unsigned_session_cookie'],
        uri: env['REQUEST_URI'],
        backtrace: @backtrace
      }

      Rails.logger.debug '------'
      Rails.logger.ap @ex.class
      Rails.logger.ap @ex
      Rails.logger.ap "status: #{@status}"
      if @ex.is_a? Errno::ENOENT
        info "Forcing Errno::ENOENT to a 404"
        @status = 404
      end

      @layout = if @details[:params][:modal]
                  'modal'
                elsif @details[:params][:side_pane]
                  'side_pane'
                else
                  'application'
                end

      case @status
      when 404
        return file_not_found
      else
        # 500
        return internal_server_error
      end
    rescue => new_ex
      render_exception new_ex
    end
  end

  def file_not_found
    respond_to do |format|
      info "file_not_found request.content_type: #{request.content_type}"
      format.html do
        @title = '404 File Not Found'
        info "rendering html format"
        render template: 'errors/file_not_found', layout: @layout
      end
      format.json do
        render json: @details
      end
    end
  end

  def internal_server_error

    respond_to do |format|
      format.html do
        @title = "#{@status} Error"
        @title_icon = 'alert'
        render template: 'errors/internal_server_error', layout: @layout
      end
      format.json do
        @details[:http_status] = @status
        @details[:status] = 'error'
        render json: @details
      end
      format.js do
        render template: 'errors/internal_server_error'
      end
    end
  end

end