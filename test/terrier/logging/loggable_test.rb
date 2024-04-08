require "test_helper"

class LoggableTest < ActiveSupport::TestCase
  class DummyClass
    include Loggable
  end

  class Dummy2Class
    include Loggable
  end

  LOG_LEVELS = %i[success debug info warn separator error]

  def setup
    @dummy = DummyClass.new
    @dummy.get_logger.level = "debug"

    @dummy2 = Dummy2Class.new
    @dummy2.get_logger.level = "debug"
  end

  ## #get_logger

  test "#get_logger should return a MultiLogger if no logger exists" do
    assert_equal MultiLogger, @dummy.get_logger.class
  end

  test "#get_logger should return the existing logger if one exists" do
    assert_equal @dummy.get_logger.object_id, @dummy.get_logger.object_id
  end

  ## #wrap_logger

  test "#wrap_logger should wrap the logger given with a MultiLogger" do
    @dummy.wrap_logger Rails.logger
    assert_equal MultiLogger, @dummy.get_logger.class
    assert_equal @dummy.get_logger.logger, Rails.logger
  end

  test "#wrap_logger should not wrap the logger if it is already a MultiLogger" do
    @dummy.wrap_logger Rails.logger
    @dummy.wrap_logger Rails.logger
    assert_equal MultiLogger, @dummy.get_logger.class
    assert_equal @dummy.get_logger.logger, Rails.logger
  end

  test "#wrap_logger logs to the logger given" do
    output = StringIO.new
    @dummy.wrap_logger Logger.new output
    @dummy.info "Test message"
    output.rewind
    assert_match /Test message/, output.read
  end

  ## #log_with_callback

  (LOG_LEVELS - [:error]).each do |log_level|
    test "#log_with_callback should execute the callback passed within the given block for ##{log_level}" do
      callback_called = false
      callback = ->(level, message, *args) { callback_called = true }
      @dummy.log_with_callback(callback) do
        @dummy.send(log_level, "Info message with callback")
      end
      assert callback_called
    end
  end

  test "#log_with_callback should execute the callback passed within the given block for #error" do
    callback_called = false
    callback = ->(level, message, *args) { callback_called = true }
    @dummy.log_with_callback(callback) do
      @dummy.error StandardError.new "Error message with callback"
    end
    assert callback_called
  end

  test "#log_with_callback should not execute the callback after the block has been executed" do
    callback_called = false
    callback = ->(level, message, *args) { callback_called = true }
    @dummy.log_with_callback(callback) { }
    @dummy.info "Info message without callback"
    refute callback_called
  end

  test "#log_with_callback should not execute the callback if the block raises an unhandled exception" do
    callback_called = false
    callback = ->(level, message, *args) { callback_called = true }
    assert_raises(StandardError) do
      @dummy.log_with_callback(callback) { raise StandardError }
    end
    @dummy.info "Info message without callback"
    refute callback_called
  end

  ## #indented TODO: write more granular tests for #indented

  test "indented works" do
    @dummy.indented(3) do
      @dummy.info "3"
      @dummy.indented.info "4"
    end
  end

  test "nested indented works" do
    @dummy.success "0"
    @dummy.indented(1) do
      @dummy.info "1"
      @dummy.indented(1) do
        @dummy.debug "2"
        @dummy.indented(1).separator "3"
        @dummy.indented(2).debug "4"
        @dummy.indented(1) do
          @dummy2.info "3"
          @dummy2.indented(1).warn "4"
          begin
            raise StandardError.new "Error"
          rescue => ex
            @dummy2.indented(2).error ex
          end
        end
      end
      @dummy.info "1"
      @dummy.indented(1).info "2"
    end
    @dummy.info "0"
    @dummy.indented(1).info "1"
  end

  ## log level methods

  test "#info should log with level :info" do
    assert_output(/INFO \[DummyClass\] Test message/) { @dummy.info "Test message" }
  end

  test "#success should log with level :success" do
    assert_output(/SUCCESS \[DummyClass\] Test message/) { @dummy.success "Test message" }
  end

  test "#separator should log with level :separator" do
    assert_output(/SEPARATOR ==== \[DummyClass\] Test message ====\n/) { @dummy.separator "Test message" }
  end

  test "#debug should log with level :debug" do
    assert_output(/DEBUG \[DummyClass\] Test message/) { @dummy.debug "Test message" }
  end

  test "#warn should log with level :warn" do
    assert_output(/WARN \[DummyClass\] Test message/) { @dummy.warn "Test message" }
  end

  test "#error should log with level :error" do
    assert_output(/ERROR \[DummyClass\] Test message/) { @dummy.error StandardError.new "Test message" }
  end

  ## #bench

  test "#bench should log the expected elapsed time of the block given" do
    output = StringIO.new
    @dummy.wrap_logger Logger.new output
    @dummy.bench("Test block") { sleep(0.1) }
    output.rewind
    elapsed = output.read&.match(/Executed 'Test block' in (.+)ms/)&.captures[0].to_f
    assert_operator elapsed, :>=, 100, "Benchmarking should of taken at least 100ms"
    assert_operator elapsed, :<=, 120, "Benchmarking took unexpectedly long"
  end
end