require 'amazing_print'

AmazingPrint.defaults ||= {}
AmazingPrint.defaults[:ruby19_syntax] = true

class MultiLogger

  attr_accessor :use_stdout, :use_rails, :logger, :stream, :level, :prefix, :messages

  LEVELS = %w(debug info success separator warn error).freeze

  LEVEL_VALUES = {
    'debug' => 0,
    'info' => 1,
    'success' => 2,
    'separator' => 3,
    'warn' => 4,
    'error' => 5,
  }.freeze

  # @param prefix [String] a prefix added to each log message
  # @param opts [Hash] deprecated. Use specific keyword arguments
  # @param logger [::Logger, ActiveSupport::Logger, MultiLogger, nil] an inner logger to log to
  # @param use_stdout [Boolean, nil] whether to log using `puts`. If nil, defaults to false if an inner logger is provided, otherwise true
  # @param use_rails [Boolean, nil] whether to log using Rails.logger. If nil, defaults to false if an inner logger is provided, otherwise true
  def initialize(prefix, opts={}, logger: nil, use_stdout: nil, use_rails: nil)
    @prefix = prefix
    @logger = logger || opts[:logger]
    @use_stdout = use_stdout || opts[:use_stdout]
    @use_rails = use_rails || opts[:use_rails]

    # if a specific logger is passed in, use_stdout and use_rails are opt-in (off by default)
    # if a specific logger is not passed in, use_stdout and use_rails are opt-out (on by default)
    @use_stdout = @logger.nil? if @use_stdout.nil?
    @use_rails = @logger.nil? if @use_rails.nil?

    @level = 'info'
    @messages = []
  end

  # Opens a response stream to log to
  # @param response [ActionDispatch::Response] the response to stream to
  def stream_response(response)
    response.headers["Content-Type"] = "layout/json"
    @stream = response.stream
    @stream.write '['
  end

  # Closes the previously opened response stream
  def close_stream
    return unless @stream
    @stream.write '{}]'
    @stream.close
  end

  # Logs the given message at debug level
  # @param message [String]
  # @param args [Array] an array of objects that will be AwesomePrinted after the message
  def debug(message, *args)
    log 'debug', message, *args
  end

  # Logs the given message at info level
  # @param message [String]
  # @param args [Array] an array of objects that will be AwesomePrinted after the message
  def info(message, *args)
    log 'info', message, *args
  end

  # Logs the given message at success level
  # For loggers that don't support success as a level, uses 'info'
  # @param message [String]
  # @param args [Array] an array of objects that will be AwesomePrinted after the message
  def success(message, *args)
    log 'success', message, *args
  end

  # Logs the given message at warn level
  # @param message [String]
  # @param args [Array] an array of objects that will be AwesomePrinted after the message
  def warn(message, *args)
    log 'warn', message, *args
  end

  # Logs the given message as a "separator", i.e. the message is surrounded with equals signs
  # @param message [String]
  # @param args [Array] an array of objects that will be AwesomePrinted after the message
  def separator(message, *args)
    message = "==== #{message} ===="
    log 'separator', message, *args
  end

  # Logs the given exception or message at error level
  # @param ex [Exception, String]
  # @param args [Array] an array of objects that will be AwesomePrinted after the message
  def error(ex, *args)
    if ex.is_a?(Exception)
      message = ex.message
      unless ex.backtrace.nil?
        ex.backtrace[0..20].each do |line|
          message += "\n#{line}"
        end
      end
    else
      message = ex
    end
    log 'error', message, *args
  end

  # Logs the given message at the given log level
  # @param level [String] one of 'debug', 'info', 'success', 'separator', 'warn', 'error'
  # @param message [String]
  # @param args [Array] an array of objects that will be AwesomePrinted after the message
  def log(level, message, *args)
    return if LEVEL_VALUES[@level] > LEVEL_VALUES[level]
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
  # @param level [String] one of 'debug', 'info', 'success', 'separator', 'warn', 'error'
  # @param s [Object] the message to log
  def write(level, s)
    logger_level = %w(separator success).index(level) ? 'info' : level
    logger_message = "#{@prefix} #{s}"
    if @logger
      if @logger.respond_to?(level)
        @logger.send level, logger_message
      else
        @logger.send logger_level, logger_message
      end
    end

    if Rails&.logger && @use_rails
      Rails.logger.send logger_level, logger_message
    end

    stdout_message = "#{level.upcase} -- #{@prefix} #{s}"
    if @use_stdout
      puts stdout_message
    end
    write_stream level, stdout_message
  end

  # writes output as a json object to @messages and the output stream, if opened
  # @param level [String] one of 'debug', 'info', 'success', 'separator', 'warn', 'error'
  # @param s [Object] the message to log
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
