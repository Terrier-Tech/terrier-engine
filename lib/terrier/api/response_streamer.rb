# manages the execution of actions that stream their responses to the client
# this class also implements Loggable so that it can be inserted into
# Loggable classes to print the log output to the progressive form
class ResponseStreamer

  attr_accessor :prefix, :template

  def initialize(controller)
    @controller = controller
    @prefix = controller.class.name.gsub 'Controller', ''
    @sse = ActionController::Live::SSE.new(controller.response.stream)
    controller.response.headers['Content-Type'] = 'text/event-stream'
    controller.response.headers["Last-Modified"] = Time.now.httpdate
  end

  def run
    begin
      yield self
      # tell the client to close, otherwise the EventSource will keep re-sending the request
      write '_close'
    rescue => ex
      error ex.message, ex.backtrace
      Rails.logger.warn "Error executing progressive: #{ex.message}"
      ex.backtrace.filter_backtrace.each do |line|
        Rails.logger.warn line
      end
    ensure
      @sse.close
      close_output_file
    end
  end

  # write the raw body to the stream
  # @param type [String] is used on the frontend to distinguish different event types
  # @param body [Hash] a has containing arbitrary data
  def write(type, body={})
    @sse.write body, event: type
  end

  def error(message, backtrace = [])
    if message.respond_to? :backtrace
      backtrace = message.backtrace
    end
    backtrace = backtrace.filter_backtrace
    body = {
      message: message,
      prefix: @prefix,
      backtrace: backtrace
    }
    write '_error', body
    write_output "ERROR #{@prefix} :: #{message}"
    backtrace.each do |line|
      write_output line
    end
  end

  def log(level, message)
    body = {
      level: level,
      prefix: @prefix,
      message: message
    }
    write '_log', body
    write_output "#{level.upcase} #{@prefix} :: #{message}"
  end

  def debug(message)
    log 'debug', message
  end

  def info(message)
    log 'info', message
  end

  def warn(message)
    log 'warn', message
  end

  def success(message)
    log 'success', message
  end

  # tells the runner to write all of its output to a file as it runs
  # this must be called _before_ the runner executes
  def open_output_file(abs_path)
    Rails.logger.debug "Writing #{@prefix} streaming output to #{abs_path}"
    @out_file = File.open abs_path.to_s, 'wt'
  end

  # closes the output file opened with `open_output_file`
  def close_output_file
    if @out_file
      @out_file.close
      @out_file = nil
    end
  end

  protected

  # writes raw output to the file opened with `open_output_file`
  def write_output(raw)
    return unless @out_file
    @out_file.puts raw
  end

end