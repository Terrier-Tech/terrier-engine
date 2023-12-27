require "test_helper"

class LoggableTest < ActiveSupport::TestCase
  class DummyClass
    include Loggable
  end

  LOG_LEVELS = %i[success debug info warn separator error]

  def setup
    @dummy = DummyClass.new
    @dummy.get_logger.level = "debug"
  end

  ## Wrap logger

  test "#{Loggable.name} #wrap_logger should wrap the logger given with a MultiLogger" do
    @dummy.wrap_logger Rails.logger
    assert @dummy.get_logger.is_a?(MultiLogger)
    assert_equal @dummy.get_logger.logger, Rails.logger
  end

  test "#{Loggable.name} #wrap_logger logs to the logger given" do
    output = StringIO.new
    @dummy.wrap_logger Logger.new output
    @dummy.info "Test message"
    output.rewind
    assert_match /Test message/, output.read
  end

  test "#{Loggable.name} #wrap_logger :override_prefixes option overrides previous logger prefixes" do
    output = StringIO.new
    @dummy.wrap_logger Logger.new(output)
    @dummy.wrap_logger @dummy.get_logger
    @dummy.info "Message with nested prefixes"
    output.rewind
    assert_match /-- : \[LoggableTest::DummyClass\] \[LoggableTest::DummyClass\] Message with nested prefixes/, output.read
    @dummy.wrap_logger @dummy.get_logger, override_prefixes: true
    @dummy.info "Message without nested prefixes"
    output.rewind
    assert_match /-- : \[LoggableTest::DummyClass\] Message without nested prefixes/, output.read
  end

  test "#{Loggable.name} #wrap_logger :demodulize option adds only the current class as the prefix" do
    output = StringIO.new
    @dummy.wrap_logger Logger.new(output), demodulize: true
    @dummy.info "Test message"
    output.rewind
    assert_match /-- : \[DummyClass\] Test message/, output.read
  end

  ## Normal logging

  test "#{Loggable.name} #info should log with level :info" do
    assert_output(/INFO -- \[LoggableTest::DummyClass\] Test message/) { @dummy.info "Test message" }
  end

  test "#{Loggable.name} #success should log with level :success" do
    assert_output(/SUCCESS -- \[LoggableTest::DummyClass\] Test message/) { @dummy.success "Test message" }
  end

  test "#{Loggable.name} #separator should log with level :separator" do
    assert_output(/SEPARATOR -- \[LoggableTest::DummyClass\] ==== Test message ====\n/) { @dummy.separator "Test message" }
  end

  test "#{Loggable.name} #debug should log with level :debug" do
    assert_output(/DEBUG -- \[LoggableTest::DummyClass\] Test message/) { @dummy.debug "Test message" }
  end

  test "#{Loggable.name} #warn should log with level :warn" do
    assert_output(/WARN -- \[LoggableTest::DummyClass\] Test message/) { @dummy.warn "Test message" }
  end

  test "#{Loggable.name} #error should log with level :error" do
    assert_output(/ERROR -- \[LoggableTest::DummyClass\] Test message/) { @dummy.error StandardError.new "Test message" }
  end

  ## Callback

  (LOG_LEVELS - [:error]).each do |log_level|
    test "#{Loggable.name} should execute the block given as a callback when calling ##{log_level}" do
      callback_called = false
      @dummy.set_log_callback { |level, message, *args| callback_called = true }
      @dummy.send(log_level, "Info message with callback")
      assert callback_called, "Callback was not called"
    end
  end

  test "#{Loggable.name} should execute the block given as a callback when calling #error" do
    callback_called = false
    @dummy.set_log_callback { |level, message, *args| callback_called = true }
    @dummy.error StandardError.new("Test message")
    assert callback_called
  end

  ## Bench

  test "#{Loggable.name} #bench should log the expected elapsed time of the block given" do
    output = StringIO.new
    @dummy.wrap_logger Logger.new output
    @dummy.bench("Test block") { sleep(0.1) }
    output.rewind
    elapsed = output.read.match(/Executed 'Test block' in (.+)ms/).to_a[1].to_f
    assert_operator elapsed, :>=, 100, "Benchmarking should of taken at least 100ms"
    assert_operator elapsed, :<=, 120, "Benchmarking took unexpectedly long"
  end
end