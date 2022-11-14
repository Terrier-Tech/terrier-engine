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

    # start and end are 1/1
    if @start_date.month==1 && @start_date.day==1 && @end_date.month==1 && @end_date.day==1
      if @end_date == @start_date + 1.year
        # a single year
        return @start_date.year.to_s
      else
        # year range
        return "#{@start_date.year}:#{@end_date.year-1}"
      end
    end

    # start and end are the first of the month
    if @start_date.day == 1 && @end_date.day == 1
      if @end_date == @start_date + 1.month
        # a single month
        return @start_date.strftime('%Y-%m')
      end
    end

    # a single day
    if @end_date == @start_date + 1.day
      return @start_date.to_s
    end

    "#{self.start_date}:#{self.end_date - 1.day}"
  end

  # @return [String] a human-friendly description of the period
  def display_name

    # start and end are 1/1
    if @start_date.month == 1 && @start_date.day == 1 && @end_date.month == 1 && @end_date.day == 1
      if @end_date == @start_date + 1.year
        # a single year
        return @start_date.year.to_s
      else
        # year range
        return "#{@start_date.year}-#{@end_date.year - 1}"
      end
    end

    # start and end are the first of the month
    if @start_date.day == 1 && @end_date.day == 1
      if @end_date == @start_date + 1.month
        # a single month
        return @start_date.strftime('%B %Y')
      end
    end

    # a single day
    if @end_date == @start_date + 1.day
      return @start_date.strftime(SHORT_DATE_FORMAT)
    end

    "#{self.start_date.strftime(SHORT_DATE_FORMAT)} - #{(self.end_date - 1.day).strftime(SHORT_DATE_FORMAT)}"
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

  # @return a new DatePeriod for the last `n` days
  # @param n [Fixnum]
  # @param today [Date,String,nil] can be passed if you don't want to start at today
  def self.last_n_days(n, today=nil)
    today = Date.parse(today) if today.is_a?(String)
    today ||= Date.today
    DatePeriod.new today - n.days, today + 1.day
  end

  # @return a new DatePeriod for the last 30 days
  # @param today [Date,String,nil] can be passed if you don't want to start at today
  def self.last_30(today=nil)
    last_n_days 30, today
  end

  # @return a new DatePeriod for the last 30 days
  # @param today [Date,String,nil] can be passed if you don't want to start at today
  def self.last_7(today=nil)
    last_n_days 7, today
  end

  # Iterates from the start_date to end_date by the given interval, yielding
  # a new period for each interval and returning the mapped results
  # @yield [DatePeriod]
  # @param duration [ActiveSupport::Duration] the maximum duration of each interval
  def each(duration)
    d = self.start_date
    out = []
    while d < end_date
      end_date_ = [d + duration, @end_date].min
      out << yield(DatePeriod.new(d, end_date_))
      d += duration
    end
    out
  end

end