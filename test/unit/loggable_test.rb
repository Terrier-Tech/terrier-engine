require 'test_helper'
require 'spreadsheet/workbook'

require 'test_helper'

class LoggableTest < ActiveSupport::TestCase
  class DummyClass
    include Loggable
  end

  setup do
    @dummy_instance = DummyClass.new
    @test_logger = Logger.new(STDOUT)
    @dummy_instance.wrap_logger(@test_logger)
    @dummy_instance.get_logger.level = 'debug'  # Set log level to 'debug'
  end

  test "should log messages correctly" do
    assert_nothing_raised do
      @dummy_instance.info("Info message")
      @dummy_instance.success("Success message")
      @dummy_instance.debug("Debug message")
      @dummy_instance.warn("Warning message")
      @dummy_instance.error(StandardError.new("Error message"))
    end
  end

  test "should call the set log callback" do
    callback_called = false

    @dummy_instance.set_log_callback do |level, message, *args|
      callback_called = true
    end

    @dummy_instance.info("Info message with callback")

    assert callback_called, "Callback was not called"
  end

  test "should benchmark correctly" do
    elapsed_time = @dummy_instance.bench("Test Block") do
      # Some code to benchmark
      t = Time.now
      sleep(0.1)
      dt = Time.now - t
      dt
    end

    assert elapsed_time >= 0.1, "Benchmarking did not measure elapsed time correctly"
  end
end