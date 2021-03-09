# including this module in a class will create a logger for it and
# make some convenience methods for writing to it, like info, warn, and error
module Loggable

  def get_logger
    return @logger if @logger
    @logger = MultiLogger.new "[#{self.class.name}]"
  end

  def success(m, *args)
    get_logger.success m, *args
  end

  def debug(m, *args)
    get_logger.debug m, *args
  end

  def info(m, *args)
    get_logger.info m, *args
  end

  def warn(m, *args)
    get_logger.warn m, *args
  end

  def separator(m, *args)
    get_logger.separator m, *args
  end

  def error(ex, *args)
    get_logger.error ex, *args
  end

  def bench(name)
    t = Time.now
    res = yield
    dt = Time.now - t
    info "Executed '#{name}' in #{dt.to_ms}ms"
    res
  end

end