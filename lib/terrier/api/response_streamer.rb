# manages the execution of actions that stream their responses to the client
# this class also implements Loggable so that it can be inserted into
# Loggable classes to print the log output to the progressive form
class ResponseStreamer

  attr_accessor :prefix, :template

  def initialize(controller)
    @controller = controller
    @prefix = controller.class.name.gsub 'Controller', ''
    @stream = controller.response.stream
    controller.response.headers['Content-Type'] = 'text/event-stream'
    controller.response.headers["Last-Modified"] = Time.now.httpdate
  end

  def run
    begin
      @stream.write '['
      yield self
      send_response
      @stream.write ']'
    rescue => ex
      error ex.message, ex.backtrace
      Rails.logger.warn "Error executing progressive: #{ex.message}"
      ex.backtrace.filter_backtrace.each do |line|
        Rails.logger.warn line
      end
    ensure
      @stream.close if @stream
      close_output_file
    end
  end

  def update(prog, message = '')
    body = {
      status: 'update',
      prefix: @prefix,
      progress: prog,
      message: message
    }
    @stream.write(body.to_json + ',')
    write_output "UPDATE #{prog} #{@prefix} :: #{message}"
  end

  def error(message, backtrace = [])
    if message.respond_to? :backtrace
      backtrace = message.backtrace
    end
    backtrace = backtrace.filter_backtrace
    body = {
      status: 'error',
      message: message,
      prefix: @prefix,
      backtrace: backtrace
    }
    @stream.write(body.to_json + ',')
    write_output "ERROR #{@prefix} :: #{message}"
    backtrace.each do |line|
      write_output line
    end
  end

  def log(level, message)
    body = {
      status: 'log',
      level: level,
      prefix: @prefix,
      message: message
    }
    @stream.write(body.to_json + ',')
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

  # send raw HTML that will be rendered to the custom area (upper left corner)
  def custom(output)
    log 'custom', output
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

  def send_response
    render_options = {
      formats: [:js],
      layout: false
    }
    @template ||= @controller.params[:template]
    if @template.present?
      render_options[:template] = @template
    end
    response_s = @controller.render_to_string render_options
    body = {
      status: 'done',
      body: response_s
    }
    @stream.write(body.to_json)
  end

end