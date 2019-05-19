# including this module in a class will create a logger for it and
# make some convenience methods for writing to it, like info, warn, and error
module Loggable

  def get_logger
    return @logger if @logger
    @logger = MultiLogger.new "[#{self.class.name}]"
  end

  def info(m)
    get_logger.info m
  end

  def warn(m)
    get_logger.warn m
  end

  def separator(m)
    get_logger.separator m
  end

  def error(ex)
    get_logger.error ex
  end

  def bench(name)
    t = Time.now
    res = yield
    dt = Time.now - t
    info "Executed '#{name}' in #{dt.to_ms}ms"
    res
  end

end