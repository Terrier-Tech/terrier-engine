require 'amazing_print'

AmazingPrint.defaults ||= {}
AmazingPrint.defaults[:ruby19_syntax] = true

class MultiLogger

  attr_accessor :use_stdout, :use_rails, :logger, :stream, :level, :prefix, :messages

  LEVELS = %w(debug info success separator warn error)
  MAX_LOG_LEVEL_LENGTH = LEVELS.map(&:length).max

  def initialize(prefix, opts={})
    @prefix = prefix
    @logger = opts[:logger]
    @use_stdout = opts[:use_stdout]
    @use_rails = opts[:use_rails]

    # if a specific logger is passed in, use_stdout and use_rails are opt-in (off by default)
    # if a specific logger is not passed in, use_stdout and use_rails are opt-out (on by default)
    @use_stdout = @logger.nil? if @use_stdout.nil?
    @use_rails = @logger.nil? if @use_rails.nil?

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

  def debug(message, *args)
    log 'debug', message, *args
  end

  def info(message, *args)
    log 'info', message, *args
  end

  def success(message, *args)
    log 'success', message, *args
  end

  def warn(message, *args)
    log 'warn', message, *args
  end

  def separator(message, *args)
    log 'separator', message, *args
  end

  def error(ex, *args)
    if ex.is_a?(String)
      log 'error', ex, *args
      return
    end
    message = ex.message
    unless ex.backtrace.nil?
      ex.backtrace[0..20].each do |line|
        message += "\n#{line}"
      end
    end
    log 'error', message, *args
  end

  def log(level, message, *args)
    return if LEVELS.index(@level) > LEVELS.index(level)
    if level == 'separator' && message !~ /==== .* ====/
      message = "==== #{message} ===="
    end
    write level, message

    # amazing_print extra args
    rails_level = %w(separator success).index(level) ? 'info' : level
    args.each do |arg|
      if @logger && @logger.respond_to?(:ap)
        @logger.ap arg, rails_level
      end

      if @use_stdout
        ap arg
      end

      if Rails&.logger && @use_rails
        Rails.logger.ap arg, rails_level
      end

      write_stream level, arg.inspect # TODO: figure out how to send ap output to the stream
    end
  end


  private


  # writes directly to the appropriate outputs
  def write(level, s)
    logger_level = %w(separator success).index(level) ? 'info' : level
    logger_message = "#{@prefix.blank? ? "" : @prefix + " "}#{s}"
    if @logger
      @logger.send logger_level, logger_message
    end

    if Rails&.logger && @use_rails
      Rails.logger.send logger_level, logger_message
    end

    stdout_message = level.upcase.rjust(MAX_LOG_LEVEL_LENGTH) + " " + logger_message
    if @use_stdout
      puts stdout_message
    end
    write_stream level, stdout_message
  end

  def write_stream(level, s)
    time = Time.now.strftime(PRETTY_TIME_FORMAT)
    @messages << {prefix: @prefix, time: time, level: level, message: s}
    if @stream
      chunk = {
        level: level,
        message: CGI.escapeHTML(s),
        time: time,
        prefix: @prefix
      }
      @stream.write "#{Oj.dump(chunk)},"
    end
  end

end
