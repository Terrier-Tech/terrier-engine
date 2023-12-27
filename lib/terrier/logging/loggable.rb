# including this module in a class will create a logger for it and
# make some convenience methods for writing to it, like info, warn, and error
module Loggable

  # Returns the logger instance, initializing it if not already done.
  def get_logger
    return @logger if @logger
    @logger = MultiLogger.new "[#{self.class.name}]"
  end

  # Sets a callback to be called on logging events.
  # This can be used to set a progressive form update callback.
  def set_log_callback(&callback)
    @log_callback = callback
  end

  # Wraps the given inner logger with a MultiLogger, prefixed with the class name.
  #
  # @param opts [Hash]
  # @option opts [Boolean] :override_prefixes Removes previous MultiLogger nested prefixes
  # @option opts [Boolean] :demodulize Removes full module path from prefix [Module::Class] => [Class]
  def wrap_logger(inner_logger, **opts)
    return if inner_logger.nil?
    if opts[:override_prefixes]
      while inner_logger.is_a?(MultiLogger)
        if inner_logger.logger.nil?
          inner_logger = inner_logger.duplicate(prefix: "")
          break
        end
        inner_logger = inner_logger.logger
      end
    end
    prefix = opts[:demodulize] ? "[#{self.class.name.demodulize}]" : "[#{self.class.name}]"
    @logger = MultiLogger.new prefix, logger: inner_logger, **opts
  end

  # Logs a message with the given level and calls the set callback if available.
  def log_with_callback(level, message, *args)
    get_logger.send(level, message, *args)
    @log_callback&.call(level, message, *args)
  end

  def success(m, *args)
    log_with_callback(:success, m, *args)
  end

  def debug(m, *args)
    log_with_callback(:debug, m, *args)
  end

  def info(m, *args)
    log_with_callback(:info, m, *args)
  end

  def warn(m, *args)
    log_with_callback(:warn, m, *args)
  end

  def separator(m, *args)
    log_with_callback(:separator, m, *args)
  end

  def error(ex, *args)
    log_with_callback(:error, ex, *args)
  end

  # Benchmarks the execution time of the given block and logs it as an info message.
  def bench(name)
    t = Time.now
    res = yield
    dt = Time.now - t
    info "Executed '#{name}' in #{dt.to_ms}ms"
    res
  end
end
