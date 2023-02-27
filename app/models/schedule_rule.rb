
# require_relative '../../app/models/concerns/terrier/embedded'

class Array
  def index_runs
    runs = []
    run = nil
    self.each do |i|
      if run
        if i > run.last + 1 # end of run
          runs << run
          run = [i]
        else
          if run.length == 1
            run << i
          else
            run[-1] = i
          end
        end
      else
        run = [i]
      end
    end
    runs << run if run
    runs
  end
end


WEEKS_PER_31_MONTH = 4.428
WEEKS_PER_30_MONTH = 4.285

WEEKS_PER_MONTH = {
    january: WEEKS_PER_31_MONTH,
    february: 4.0,
    march: WEEKS_PER_31_MONTH,
    april: WEEKS_PER_30_MONTH,
    may: WEEKS_PER_31_MONTH,
    june: WEEKS_PER_30_MONTH,
    july: WEEKS_PER_31_MONTH,
    august: WEEKS_PER_31_MONTH,
    september: WEEKS_PER_30_MONTH,
    october: WEEKS_PER_31_MONTH,
    november: WEEKS_PER_30_MONTH,
    december: WEEKS_PER_31_MONTH
}


class ScheduleRule
  include Terrier::Embedded

  def self.icon
    'ios-calendar-outline'
  end

  string_array_field :hours
  string_array_field :days
  string_array_field :weeks
  string_array_field :months

  def hours_display
    self.hours
  end

  def weeks_display
    if self.weeks.index 'all'
      'All Weeks'
    elsif self.weeks.index 'every_2'
      'Every Other Week'
    else
      'Week ' + self.weeks.join(', ')
    end
  end

  @hours = %w(8 9 10 11 12 13 14 15 16 17)

  @days = %w(sunday monday tuesday wednesday thursday friday saturday)
  @short_days = %w(Sun Mon Tue Wed Thu Fri Sat)

  @months = %w(january february march april may june july august september october november december)
  @short_months = %w(Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec)

  @month_groups = [%w(january february march april may june), %w(july august september october november december)]

  @quarter_january = %w(january april july october)
  @quarter_february = %w(february may august november)
  @quarter_march = %w(march june september december)

  @weeks = %w(1 2 3 4 5 every_2 all)

  class << self
    attr_accessor :days, :short_days, :months, :short_months, :month_groups, :quarter_january, :quarter_february, :quarter_march, :weeks, :hours
  end


  # returns true if the rule contains the given day
  def contains_day?(day)
    month = day.strftime('%B').downcase
    week = (((day.mday-1.0) / 7.0).floor + 1).to_s
    weeks_a = self.weeks.is_a?(Array) ? self.weeks : [self.weeks]
    weeks_s = weeks_a.compact.map(&:to_s)
    day = day.strftime('%A').downcase
    self.months.index(month) && (weeks_s.index('all') || weeks_s.index(week)) && self.days.index(day)
  end

  # returns true if the rule contains the given hour
  def contains_hour?(hour)
    self.hours.index(hour)
  end


  ## Per Year and Per Month Counting

  def num_per_year
    num = if self.weeks.index 'all'
            self.months.map do |month|
              self.days.length * WEEKS_PER_MONTH[month.to_sym]
            end.sum
          elsif self.weeks.index '5'
            self.months.map do |month|
              remainder = WEEKS_PER_MONTH[month.to_sym] % 1
              self.days.length * (self.weeks.length - 1 + remainder)
            end.sum
          elsif self.weeks.index 'every_2'
            self.months.map do |month|
              self.days.length * WEEKS_PER_MONTH[month.to_sym]/2.0
            end.sum
          else
            self.days.length * self.weeks.length * self.months.length
          end.floor

    # prevent weird cases where we compute an extra service in the year
    num = 52 if num == 53

    # weekly winter service will come out to 25 because it's floored, it should be 26
    if num == 25 && self.weeks.index('all')
      num = 26
    end

    num
  end

  def num_per_month
    pm = {}
    self.months.each do |month|
      pm[month] = if self.weeks.index 'all'
                    self.days.length * WEEKS_PER_MONTH[month.to_sym]
                  elsif self.weeks.index '5'
                    remainder = WEEKS_PER_MONTH[month.to_sym] % 1
                    self.days.length * (self.weeks.length - 1 + remainder)
                  elsif self.weeks.index 'every_2'
                    WEEKS_PER_MONTH[month.to_sym]/2.0 * self.days.length
                  else
                    self.days.length * self.weeks.length
                  end
    end
    pm
  end


  ## Summary

  def day_summary(short_days=true)
    day_indexes = self.days.map{|d| ScheduleRule.days.index(d)}.sort
    day_runs = day_indexes.index_runs
    day_runs.map do |run|
      run.map{|i| short_days ? ScheduleRule.short_days[i] : ScheduleRule.days[i].titleize }.join('-')
    end.join(', ')
  end

  def month_summary(short_months=true)
    month_indexes = self.months.map{|d| ScheduleRule.months.index(d)}.sort
    month_runs = month_indexes.index_runs.compact
    month_runs.map do |run|
      run.compact.map{|i| short_months ? ScheduleRule.short_months[i] : ScheduleRule.months[i].titleize }.join('-')
    end.join(', ')
  end

  def summary(short_days: true, short_months: true)
    "#{hours_display}; #{day_summary(short_days)}; #{weeks_display}; #{month_summary(short_months)}"
  end

end
