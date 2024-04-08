require "active_support/core_ext/module/attribute_accessors_per_thread"

# including this module in a class will create a logger for it and
# make some convenience methods for writing to it, like info, warn, and error
module Loggable

  thread_mattr_accessor :indent_level, instance_accessor: false, default: 0

  # Returns the logger instance, initializing it if not already done.
  def get_logger
    return @logger if @logger
    @logger = MultiLogger.new ""
  end

  # Wraps the given logger in a MultiLogger or overrides the logger if given a MultiLogger.
  def wrap_logger(logger, **opts)
    return if logger.nil?
    if logger.is_a? MultiLogger
      @logger = logger
    else
      @logger = MultiLogger.new "", logger:, **opts
    end
  end

  # Calls the given callback after each log event for the given block.
  def log_with_callback(callback)
    @log_callback = callback
    yield
  ensure
    @log_callback = nil
  end

  def indented(amount = 1)
    if block_given?
      Loggable.send(:indented, amount) { yield }
    else
      Loggable.send(:indented_proxy, self, prefix, amount)
    end
  end

  def success(message, *args)
    log(:success, message, *args)
  end

  def debug(message, *args)
    log(:debug, message, *args)
  end

  def info(message, *args)
    log(:info, message, *args)
  end

  def warn(message, *args)
    log(:warn, message, *args)
  end

  def separator(message, *args)
    log(:separator, message, *args)
  end

  def error(ex, *args)
    log(:error, ex, *args)
  end

  # Benchmarks the execution time of the given block and logs it as an info message.
  def bench(name)
    time = Time.now
    result = yield
    elapsed = Time.now - time
    log :info, "Executed '#{name}' in #{elapsed.to_ms}ms"
    result
  end

  class << self

    private

    def indented(amount)
      last_indent = self.indent_level
      self.indent_level += amount
      yield
    ensure
      self.indent_level = last_indent
    end

    def indented_proxy(logger, prefix, amount)
      IndentedLoggerProxy.new(logger, prefix, self.indent_level + amount)
    end

    class IndentedLoggerProxy
      def initialize(logger, prefix, indent_level)
        @logger = logger
        @prefix = prefix
        @indent_level = indent_level
      end

      def success(message, *args)
        @logger.send(:success, format_message(message, :success), *args)
      end

      def debug(message, *args)
        @logger.send(:debug, format_message(message, :debug), *args)
      end

      def info(message, *args)
        @logger.send(:info, format_message(message, :info), *args)
      end

      def warn(message, *args)
        @logger.send(:warn, format_message(message, :warn), *args)
      end

      def separator(message, *args)
        @logger.send(:separator, format_message(message, :separator), *args)
      end

      def error(ex, *args)
        @logger.send(:error, format_message(ex, :error), *args)
      end

      private

      def format_message(message, level)
        FormattedMessage.new(message, level, @prefix, @indent_level)
      end
    end
  end

  private

  def log(level, message, *args)
    message = format_message message, level
    get_logger.send(level, message, *args)
    @log_callback.call(level, message, *args) unless @log_callback.nil?
  end

  def format_message(message, level)
    case message
    when FormattedMessage
      message.message
    when String, Exception
      FormattedMessage.new(message, level, prefix, Loggable.indent_level).message
    else
      raise ArgumentError, "Invalid message type: #{message.class}"
    end
  end

  def prefix
    return @prefix if @prefix
    @prefix = "[#{self.class.name.demodulize}]"
  end

  class FormattedMessage

    INDENT_STR = "  ".freeze
    LEVELS = %i[debug info success separator warn error]
    MISSING_ERROR_LEVEL_PAD = "ERROR".rjust LEVELS.map(&:length).max

    attr_reader :message

    def initialize(message, level, prefix, indent_level)
      indent = INDENT_STR * indent_level
      @message =
        case level
        when :success, :debug, :info, :warn
          "#{indent}#{prefix} #{message}"
        when :separator
          "#{indent}==== #{prefix} #{message} ===="
        when :error
          str = "#{indent}#{prefix} #{message.message}"
          unless message.backtrace.nil?
            message.backtrace[0..20].each do |line|
              str += "\n#{MISSING_ERROR_LEVEL_PAD}#{indent}#{line}"
            end
          end
          str
        else
          raise ArgumentError, "Invalid log level: #{level}"
        end
    end
  end
end
