# represents a date range start_date and end_date (exclusive)
class DatePeriod

  attr_reader :start_date, :end_date

  # @param start_date [Date,String] is the start of period, inclusive
  # @param end_date [Date,String] is the end of period, _exclusive_
  def initialize(start_date, end_date)
    if start_date.is_a? Date
      @start_date = start_date
    else
      @start_date = Date.parse start_date
    end
    if end_date.is_a? Date
      @end_date = end_date
    else
      @end_date = Date.parse end_date
    end
  end

  # @return [String] in the original format accepted by `DatePeriod.parse`
  def to_s
    if @end_date == @start_date + 1.year
      # a single year
      @start_date.year.to_s
    elsif @start_date.month==1 && @start_date.day==1 && @end_date.month==1 && @end_date.day==1
      # year range
      "#{@start_date.year}:#{@end_date.year-1}"
    elsif @end_date == @start_date + 1.month
      # a single month
      @start_date.strftime('%Y-%m')
    elsif @end_date == @start_date + 1.day
      # a single day
      @start_date.to_s
    else
      "#{self.start_date}:#{self.end_date - 1.day}"
    end
  end

  # @param raw (String|DatePeriod) can have the following formats:
  # year: YYYY
  # year range: YYYY:YYYY
  # month: YYYY-MM
  # day: YYYY-MM-DD
  # explicit range: YYYY-MM-DD:YYYY-MM-DD
  def self.parse(raw)
    if raw.is_a? DatePeriod
      return raw
    end
    raw = raw.to_s

    if raw =~ /^\d{4}-\d{2}-\d{2}:\d{4}-\d{2}-\d{2}$/
      comps = raw.split ':'
      start_date = comps.first
      end_date = Date.parse(comps.second) + 1.day
    elsif raw =~ /^\d{4}:\d{4}$/
      years = raw.split(':').map &:to_i
      start_date = "#{years.first}-01-01"
      end_date = Date.parse("#{years.last}-01-01") + 1.year
    elsif raw =~ /^\d{4}$/
      start_date = "#{raw}-01-01"
      end_date = Date.parse(start_date) + 1.year
    elsif raw =~ /^\d{4}-\d{2}$/
      start_date = "#{raw}-01"
      end_date = Date.parse(start_date) + 1.month
    elsif raw =~ /^\d{4}-\d{2}-\d{2}$/
      start_date = raw
      end_date = Date.parse(start_date) + 1.day
    else
      raise "Invalid period format '#{raw}'"
    end
    DatePeriod.new start_date, end_date
  end

  # @return a new DatePeriod for the last 30 days
  def self.last_30
    today = Date.today
    DatePeriod.new today - 30.days, today + 1.day
  end

end