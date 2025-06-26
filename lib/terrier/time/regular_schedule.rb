require 'terrier/logging/loggable'

# Represents a regular daily/weekly/monthly schedule.
# See schedules.ts for the corresponding frontend.
class RegularSchedule
  include Loggable

  attr_reader :schedule_type, :hour_of_day, :day_of_week, :day_of_month,  :anchor

  # @param [Hash] raw the raw attributes for the schedule
  # @option raw [String] :schedule_type should be 'daily', 'weekly', 'monthly', or 'none'
  # @option raw [String,Fixnum] :hour_of_day and integer between 0 and 23
  def initialize(raw)
    h = ActiveSupport::HashWithIndifferentAccess.new raw
    @schedule_type = h[:schedule_type]

    # hour
    @hour_of_day = h[:hour_of_day] || raise("Must pass hour_of_day")
    @hour_of_day = @hour_of_day.to_i if @hour_of_day.is_a? String

    # type-specific
    case @schedule_type
    when 'weekly'
      @day_of_week = h[:day_of_week]&.downcase || raise("Must pass day_of_week for weekly schedules")
    when 'monthly'
      @day_of_month = h[:day_of_month] || raise("Must pass day_of_month for monthly schedules")
      @day_of_month = @day_of_month.to_i if @day_of_month.is_a? String
    when 'monthanchored'
      @anchor = h[:anchor]&.to_sym || raise("Must pass anchor for anchored schedules")
    else
      # cool
    end

  end

  # Computes the exact scheduled times inside the given date period
  # @param period [DatePeriod]
  # @return [Array<Time>]
  def times_for_period(period)
    times = []
    period.each 1.day do |day|
      time = Time.parse("#{day} #{@hour_of_day}")
      times << time if is_this_day?(day.start_date)
    end
    times
  end

  # @return [Boolean] true if the schedule occurs with the given day
  def is_this_day?(date=Date.today)
    case @schedule_type
    when 'daily'
      true
    when 'weekly'
      date.strftime('%A').downcase == @day_of_week
    when 'monthly'
      date.strftime('%e').strip.to_i == @day_of_month
    when 'monthanchored'
      day_matches_anchor?(date)
    else
      false
    end
  end

  # @param [Time] time the time in question
  # @return [Boolean] true if the schedule occurs within the same hour as the given time
  def is_this_hour?(time=Time.now)
    is_this_day?(time.to_date) && time.strftime('%H').to_i == @hour_of_day
  end

  private

  # @param day [Date]
  # @return [Boolean]
  def day_matches_anchor?(day)
    case @anchor
    when :first_day
      day == day.beginning_of_month
    when :first_weekday
      tmp = day.beginning_of_month
      tmp = tmp.next_day until tmp.wday.between?(1, 5)
      day == tmp
    when :last_weekday
      tmp = day.end_of_month
      tmp = tmp.prev_day until tmp.wday.between?(1, 5)
      day == tmp
    when :last_day
      day == day.end_of_month
    else raise "Unknown bound type #{@anchor.inspect}"
    end
  end

end