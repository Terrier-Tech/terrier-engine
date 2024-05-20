require 'terrier/logging/loggable'

# Represents a regular daily/weekly/monthly schedule.
# See schedules.ts for the corresponding frontend.
class RegularSchedule
  include Loggable

  attr_reader :schedule_type, :hour_of_day, :day_of_week, :day_of_month

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
      case @schedule_type
      when 'daily'
        times << time
      when 'weekly'
        times << time if day.start_date.strftime('%A').downcase == @day_of_week
      when 'monthly'
        times << time if day.start_date.strftime('%e').strip.to_i == @day_of_month
      else
        # do nothing
      end
    end
    times
  end

end