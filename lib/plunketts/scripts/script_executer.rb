require 'plunketts/io/csv_io'

class ScriptExecutor
  include Loggable

  attr_reader :cache, :each_count, :each_total
  attr_accessor :me

  def should_soft_destroy
    true
  end

  def initialize(script, cache=nil)
    @script = script
    @cache = cache
    @each_count = 0
    @each_total = 0
    @field_values = {}
    @log_lines = []
  end

  def set_field_values(values)
    @field_values = ActiveSupport::HashWithIndifferentAccess.new @script.compute_field_values(values)
  end

  # returns a ScriptRun object describing the run
  def run(stream)
    @stream = stream
    script_run = ScriptRun.new script_id: @script.id, created_at: Time.now, duration: 0
    if script_run.respond_to?(:fields)
      script_run.fields = @field_values
    end
    t = Time.now
    begin
      escaped_body = @script.body.gsub('\"', '"')
      if @stream
        @stream.write '['
      end
      eval(escaped_body, binding, 'script', 1)
      if @stream
        @stream.write '{}]'
      end
      script_run.status = 'success'

      script_run.duration = Time.now - t
      if @script.persisted? # we can't save the run if it's a temporary script
        script_run.write_log @log_lines.join("\n")
      end
    rescue => ex
      line = ex.backtrace[0].split(':')[1].to_i
      write_raw 'error', "Error on line #{line}: #{ex.message}"
      script_run.status = 'error'
      script_run.exception = ex.message
      script_run.backtrace = ex.backtrace.join("\n")
      script_run.duration = Time.now - t
      @log_lines << ex.message
      error ex
      ex.backtrace[0..10].each do |line|
        @log_lines << line
        write_raw 'error', line
      end
    ensure
      @stream.close if @stream
    end

    script_run
  end

  def write_raw(type, body, extra={})
    return unless @stream
    extra[:type] = type
    extra[:body] = CGI.escapeHTML(body)
    @stream.write(extra.to_json + ',')
  end

  def puts(message)
    write_raw 'print', message.to_s
    debug message
    @log_lines << message.to_s
  end

  def puts_count(message='')
    puts "[#{@each_count} of #{@each_total}] #{message}"
  end

  def dump_xls(data, rel_path, options={})
    abs_path = CsvIo.save_xls data, rel_path, options
    write_raw 'file', CsvIo.abs_to_rel_path(abs_path)
    puts "Wrote #{data.count} records to #{rel_path}"
  end

  def puts_file(path)
    if path.index(Rails.root.to_s)
      path = CsvIo.abs_to_rel_path path
    end
    write_raw 'file', path
    file_name = File.basename path
    puts "Showing #{file_name}"
  end

  def get_field(name)
    @field_values[name]
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
    to_address = options[:to]
    if to_address.blank?
      raise 'Must specify a :to option'
    end
    unless Rails.env == 'production'
      options[:to] = 'clypboardtesting@gmail.com'
    end

    ReportsMailer.custom(options).deliver
    puts "Sent e-mail to #{to_address}: '#{options[:subject]}'"
  end

end