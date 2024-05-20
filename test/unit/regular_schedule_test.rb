require 'test_helper'

class RegularScheduleTest < ActiveSupport::TestCase

  test 'daily' do
    schedule = RegularSchedule.new({schedule_type: 'daily', hour_of_day: '14'})

    period = DatePeriod.parse '2024-05'
    times = schedule.times_for_period period
    assert_equal 31, times.count

    assert_equal true, schedule.is_this_day?(Date.parse('2024-05-01'))
    assert_equal true, schedule.is_this_hour?(Time.parse('2024-05-01 14:14:14'))
    assert_equal false, schedule.is_this_hour?(Time.parse('2024-05-01 13:13:13'))
  end

  test 'weekly' do
    schedule = RegularSchedule.new({schedule_type: 'weekly', hour_of_day: '14', day_of_week: 'wednesday'})

    period = DatePeriod.parse '2024-05'
    times = schedule.times_for_period period
    assert_equal 5, times.count # there were 5 wednesdays in May 2024

    assert_equal true, schedule.is_this_day?(Date.parse('2024-05-22'))
    assert_equal false, schedule.is_this_day?(Date.parse('2024-05-23'))
  end

  test 'monthly' do
    day_of_month = '12'
    schedule = RegularSchedule.new({schedule_type: 'monthly', hour_of_day: '14', day_of_month: day_of_month})

    period = DatePeriod.parse '2024-05'
    times = schedule.times_for_period period
    assert_equal 1, times.count
    assert_equal "2024-05-#{day_of_month}", times[0].to_date.to_s

    assert_equal true, schedule.is_this_day?(Date.parse('2024-05-12'))
    assert_equal false, schedule.is_this_day?(Date.parse('2024-05-13'))
  end

end