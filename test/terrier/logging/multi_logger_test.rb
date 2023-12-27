require "test_helper"

class MultiLoggerTest < ActiveSupport::TestCase

  ## Default indent

  test "#{MultiLogger.name} defaults to a indent_str of '' and an indent_level of 0 if no arguments were passed" do
    logger = MultiLogger.new "prefix"
    assert_output(/-- prefix Test message/) { logger.info "Test message" }
  end

  ## Confirm indentation on outputs

  test "#{MultiLogger.name} :indent_str and :indent_level create an indent between the prefix and the message for stdout" do
    logger = MultiLogger.new "prefix", indent_str: "@", indent_level: 4, use_stdout: true
    assert_output(/@@@@prefix Test message/) { logger.info "Test message" }
  end

  test "#{MultiLogger.name} :indent_str and :indent_level create an indent between the prefix and the message for rails logger" do
    output = StringIO.new
    logger = MultiLogger.new "prefix", indent_str: "@", indent_level: 4, logger: Logger.new(output)
    logger.info "Test message"
    output.rewind
    assert_match /@@@@prefix Test message/, output.read
  end

  test "#{MultiLogger.name} :indent_str and :indent_level create an indent between the prefix and the message for Rails.logger" do
    original_rails = Rails.logger
    output = StringIO.new
    logger = MultiLogger.new "prefix", indent_str: "@", indent_level: 4, use_rails: true, logger: Logger.new(output)
    logger.info "Test message"
    output.rewind
    assert_match /@@@@prefix Test message/, output.read
  ensure
    Rails.logger = original_rails
  end

  test "#{MultiLogger.name} :indent_str and :indent_level create an indent between the prefix and the message for file_logger" do
    Tempfile.create(%w[multi_logger_file_test .txt]) do |tempfile|
      logger = MultiLogger.new "prefix", indent_str: "@", indent_level: 4, file_path: tempfile.path
      logger.info "Test message"
      assert_match /@@@@prefix Test message/, tempfile.read
    end
  end

  ## File logging

  test "#{MultiLogger.name} :file_path adds a file logger that writes to the specified file" do
    Tempfile.create(%w[multi_logger_file_test .txt]) do |tempfile|
      logger = MultiLogger.new("prefix", file_path: tempfile.path)
      logger.info "Test message"
      assert_match /prefix Test message/, tempfile.read
    end
  end

  ## #duplicate

  test "#{MultiLogger.name} #duplicate returns a new MultiLogger with the same prefix, logger, use_stdout and use_rails attrs" do
    logger = MultiLogger.new "prefix"
    dup_logger = logger.duplicate
    assert_equal(
      {prefix: logger.prefix, logger: logger.logger, use_stdout: logger.use_stdout, use_rails: logger.use_rails},
      {prefix: dup_logger.prefix, logger: dup_logger.logger, use_stdout: dup_logger.use_stdout, use_rails: dup_logger.use_rails}
    )
  end
  
  test "#{MultiLogger.name} #duplicate returns a new MultiLogger that writes to the same file if :file_path was passed" do
    Tempfile.create(%w[multi_logger_file_test .txt]) do |tempfile|
      logger = MultiLogger.new "prefix", file_path: tempfile.path
      dup_logger = logger.duplicate
      dup_logger.info "Test message"
      assert_match /prefix Test message/, tempfile.read
    end
  end

  test "#{MultiLogger.name} #duplicate returns a new MultiLogger with the same indent_level and indent_str" do
    logger = MultiLogger.new "prefix", indent_level: 2, indent_str: "@"
    dup_logger = logger.duplicate
    assert_output(/@@prefix Test message/) { dup_logger.info "Test message" }
  end

  ## #indent

  test "#{MultiLogger.name} #indent returns a new logger with an indent_level increased by 1 if no argument is passed" do
    logger = MultiLogger.new "prefix", indent_str: "@", indent_level: 2
    indented = logger.indent
    assert_output(/@@@prefix Test message/) { indented.info "Test message" }
  end

  test "#{MultiLogger.name} #indent returns a new logger with an indent_level increased by the amount passed" do
    logger = MultiLogger.new "prefix", indent_str: "@", indent_level: 2
    indented = logger.indent(3)
    assert_output(/@@@@@prefix Test message/) { indented.info "Test message" }
  end
end