require 'terrier/io/tabular_io'

class ScriptExecutor
  # Doesn't need to be Loggable, it already has all the methods

  attr_reader :cache, :each_count, :each_total, :log_lines
  attr_accessor :me, :params, :script, :file_base_url

  def should_soft_destroy
    true
  end

  def initialize(script, cache=nil, params=nil)
    @script = script
    @cache = cache
    @each_count = 0
    @each_total = 0
    @field_values = {}
    @log_lines = []
    @output_files = []
    @params = params
  end

  def set_field_values(values)
    @field_values = ActiveSupport::HashWithIndifferentAccess.new @script.compute_field_values(values)
  end

  # returns a ScriptRun object describing the run
  def init_run
    script_run = ScriptRun.new script_id: @script.id, status: 'running', created_at: Time.now, duration: 0

    if script_run.respond_to?(:fields)
      script_run.fields = @field_values
    end

    script_run
  end

  # actually executes the script
  def run(script_run, stream)
    @stream = stream
    t = Time.now
    begin
      if @stream
        @stream.write '['
      end
      res = execute_body @script.body
      if res && res.is_a?(String) && res.present? # we probably don't need to print random crap that's returned
        info "DONE: #{res}"
      end
      script_run.status = 'success'
      script_run.duration = Time.now - t
      if @script.persisted? # we can't save the run if it's a temporary script
        script_run.write_log @log_lines.join("\n")
      end
      _send_email script_run.log_url
      true
    rescue => ex
      line = ex.backtrace[0].split(':')[1].to_i
      write_raw 'error', "Error on line #{line}: #{ex.message}"
      script_run.status = 'error'
      script_run.exception = ex.message
      script_run.backtrace = ex.backtrace.join("\n")
      script_run.duration = Time.now - t
      @log_lines << ex.message
      error ex
      if @script.persisted? # we can't save the run if it's a temporary script
        script_run.write_log @log_lines.join("\n")
      end
      false
    ensure
      if @stream
        @stream.write '{}]'
      end
      @stream.close if @stream
    end
  end

  # executes the body code and returns the result
  # this needs to be wrapped so that returning from the script doesn't interrupt the run method
  def execute_body(body)
    escaped_body = body.gsub('\"', '"')
    eval(escaped_body, binding, 'script', 1)
  end

  def write_raw(type, body, extra={})
    return unless @stream
    extra[:type] = type
    extra[:body] = CGI.escapeHTML(body)
    @stream.write(extra.to_json + ',')
  end

  def puts(message)
    write_raw 'print', message.to_s
    Rails.logger.debug "(ScriptExecutor) #{message}"
    @log_lines << message.to_s
  end

  def log(level, message)
    write_raw level, message.to_s
    s = "#{level.upcase}: #{message}"
    level = 'info' if level == 'success'
    Rails.logger.send level, "(ScriptExecutor) #{s}"
    @log_lines << s
  end

  # make it work like a logger
  %w(debug info warn success).each do |level|
    define_method level do |message|
      log level, message
    end
  end

  def error(ex)
    if ex.is_a? Exception
      log 'error', ex.message
      if ex.backtrace
        ex.backtrace[0..6].each do |line|
          log 'error', line
        end
      end
    else
      log 'error', ex.to_s
    end
  end

  def puts_count(message='')
    puts "[#{@each_count} of #{@each_total}] #{message}"
  end

  def dump_xls(data, rel_path, options={})
    dump_file data, rel_path, options
  end

  def dump_csv(data, rel_path, options={})
    dump_file data, rel_path, options
  end

  # either dumps a csv or xls using TabularIo.save
  def dump_file(data, rel_path, options={})
    abs_path = TabularIo.save data, rel_path, options
    @output_files << abs_path
    write_raw 'file', TabularIo.abs_to_rel_path(abs_path)
    puts "Wrote #{data.count} records to #{rel_path}"
  end

  def puts_file(path)
    @output_files << path
    if path.index(Rails.root.to_s)
      path = TabularIo.abs_to_rel_path path
    end
    write_raw 'file', path
    file_name = File.basename path
    puts "Showing #{file_name}"
  end

  # loads either a csv or xlsx file using TabularIo.load
  def load_file(rel_path, options={})
    TabularIo.load rel_path, options
  end

  def get_field(name)
    @field_values[name]
  end

  def get_params
    @params
  end

  def each(collection)
    @each_total = collection.count
    @each_count = 0
    result = collection.map do |item|
      @each_count += 1
      yield item
    end
    @each_count = 0
    @each_total = 0
    result
  end

  def read_input(name=nil)
    if name && name.length > 0
      input = @script.script_inputs.where(name: name).first
      unless input
        raise "No input named '#{name}'"
      end
      input.read
    else # default to the first input
      input = @script.script_inputs.first
      unless input
        raise 'This script does not have any inputs!'
      end
      input.read
    end
  end

  def parse_dollars(dollars)
    if dollars.instance_of? String
      dollars = dollars.to_f
    end
    return 0 if dollars.nil? || dollars==0
    (dollars * 100).round.to_i # fix floating point truncating error
  end

  def format_cents(cents)
    "$#{'%.2f' % (cents / 100.0).round(2)}"
  end

  def email_recipients
    if Rails.env == 'production'
      if @script.email_recipients.blank?
        raise 'No e-mail recipients for this script!'
      end
      @script.email_recipients
    else
      ['clypboardtesting@gmail.com']
    end
  end

  def raw_sql(query)
    ActiveRecord::Base.connection.execute(query).to_a
  end

  # passes options nearly directly to ReportsMailer#custom
  # :to will be replaced with the testing email in non-production, but :cc will not
  def send_email(options)
    puts "send_email function is no longer supported"
  end

  def self_destruct(countdown=5)
    if countdown.present? && countdown > 0
      puts "This script will self destruct in..."
      countdown.downto(1) do |i|
        puts i
        sleep(1)
      end
    end
    puts "Bang!"
    self.script._state = 2
    self.script.save_by_user!(self.me)
  end

  private

  def _send_email(log_url)
    return if @script.email_recipients.blank?

    body = "Here is the output for script \"#{@script.title}\" "
    body += "that was executed on #{Time.now.strftime(PRETTY_DATE_FORMAT)} at #{Time.now.strftime(SHORT_TIME_FORMAT)} "
    body += "by #{me.full_name}"
    body += "\nFiles:\n"
    body += @output_files.map do |f|
      f = file_base_url + TabularIo.abs_to_rel_path(f)
      return "<a href=\"#{f}\">#{f}</a>"
    end.join("\n")
    body += "\nExecution Log\n"
    body += "<a href=\"#{log_url}\">#{log_url}</a>"

    options = {
      to: @script.email_recipients,
      subject: "#{@script.title} Result",
      body: body
    }
    unless Rails.env == 'production'
      options[:to] = ['clypboardtesting@gmail.com']
    end

    ReportsMailer.custom(options).deliver
    puts "Sent e-mail to #{options[:to].join(", ")}: '#{options[:subject]}'"
  end

end
