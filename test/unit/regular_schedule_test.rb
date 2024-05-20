require 'test_helper'

class RegularScheduleTest < ActiveSupport::TestCase

  test 'daily' do
    schedule = RegularSchedule.new({schedule_type: 'daily', hour_of_day: '14'})
    period = DatePeriod.parse '2024-05'
    times = schedule.times_for_period period
    assert_equal 31, times.count
  end

  test 'weekly' do
    schedule = RegularSchedule.new({schedule_type: 'weekly', hour_of_day: '14', day_of_week: 'wednesday'})
    period = DatePeriod.parse '2024-05'
    times = schedule.times_for_period period
    assert_equal 5, times.count # there were 5 wednesdays in May 2024
  end

  test 'monthly' do
    day_of_month = '12'
    schedule = RegularSchedule.new({schedule_type: 'monthly', hour_of_day: '14', day_of_month: day_of_month})
    period = DatePeriod.parse '2024-05'
    times = schedule.times_for_period period
    assert_equal 1, times.count
    assert_equal "2024-05-#{day_of_month}", times[0].to_date.to_s
  end

end