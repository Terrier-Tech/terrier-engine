class MultiLogger

  attr_accessor :use_stdout, :use_rails, :stream, :level, :prefix, :messages

  LEVELS = %w(debug info separator warn error)

  def initialize(prefix, opts={})
    @prefix = prefix
    @use_stdout = opts[:use_stdout] || true
    @use_rails = opts[:use_rails] || true
    @level = 'info'
    @messages = []
  end

  def stream_response(response)
    response.headers["Content-Type"] = "layout/json"
    @stream = response.stream
    @stream.write '['
  end

  def close_stream
    return unless @stream
    @stream.write '{}]'
    @stream.close
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

  def separator(message)
    log 'separator', message
  end

  def error(ex)
    message = ex.message
    ex.backtrace.each do |line|
      message += "\n#{line}"
    end
    log 'error', message
  end

  def log(level, message)
    return if LEVELS.index(@level) > LEVELS.index(level)
    time = Time.now.strftime(PRETTY_TIME_FORMAT)
    if level == 'separator'
      s = "#{@prefix} :: ==== #{message} ===="
    else
      s = "#{@prefix} #{level.upcase} :: #{message}"
    end
    if @use_rails
      Rails.logger.debug s
    end
    if @use_stdout
      puts s
    end
    @messages << {prefix: @prefix, time: time, level: level, message: message}
    if @stream
      chunk = {
          level: level,
          message: CGI.escapeHTML(message),
          time: time,
          prefix: @prefix
      }
      @stream.write "#{Oj.dump(chunk)},"
    end
  end
end