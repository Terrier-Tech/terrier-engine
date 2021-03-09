class DummyService

  def run_with_logger(logger)
    logger.success 'success'
    logger.debug "debug"
    logger.info "info"
    logger.warn "warn"
    begin
      raise "exception"
    rescue => ex
      logger.error ex
    end
  end

end