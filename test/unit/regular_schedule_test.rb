require 'test_helper'

class RegularScheduleTest < ActiveSupport::TestCase

  setup do
    @daily = RegularSchedule.new(schedule_type: 'daily', hour_of_day: '14')
    @weekly = RegularSchedule.new(schedule_type: 'weekly', hour_of_day: '14', day_of_week: 'wednesday')
    @monthly = RegularSchedule.new(schedule_type: 'monthly', hour_of_day: '14', day_of_month: '12')
  end

  test 'daily schedule times_for_period should match every day in month' do
    period = DatePeriod.parse('2024-05')
    actual = @daily.times_for_period(period)
    expected = (1..31).map { |n| Time.new(2024, 5, n, 14) }

    assert_equal expected, actual
  end

  test 'weekly schedule times_for_period should match every wednesday in month' do
    period = DatePeriod.parse('2024-05')
    actual = @weekly.times_for_period(period)
    expected = [
      Time.new(2024, 5, 1, 14),
      Time.new(2024, 5, 8, 14),
      Time.new(2024, 5, 15, 14),
      Time.new(2024, 5, 22, 14),
      Time.new(2024, 5, 29, 14),
    ]

    assert_equal expected, actual
  end

  test 'monthly schedule times_for_period should match 12th day of month' do
    period = DatePeriod.parse('2024-05')
    actual = @monthly.times_for_period(period)
    expected = [
      Time.new(2024, 5, 12, 14),
    ]

    assert_equal expected, actual
  end

  test 'daily schedule is_this_day? should match any day' do
    assert_equal true, @daily.is_this_day?(Date.parse('2024-05-01'))
  end

  test 'daily schedule is_this_hour? should match correct time on any date' do
    assert_equal true, @daily.is_this_hour?(Time.parse('2024-05-01 14:14:14'))
  end

  test 'daily schedule is_this_hour? should not match incorrect time' do
    assert_equal false, @daily.is_this_hour?(Time.parse('2024-05-01 13:13:13'))
  end

  test 'weekly schedule is_this_day? should match correct day of any week' do
    assert_equal true, @weekly.is_this_day?(Date.parse('2024-05-01'))
  end

  test 'weekly schedule is_this_day? should not match incorrect day of week' do
    assert_equal false, @weekly.is_this_day?(Date.parse('2024-05-02'))
  end

  test 'monthly schedule is_this_day? should match correct day of month' do
    assert_equal true, @monthly.is_this_day?(Date.parse('2024-05-12'))
  end

  test 'monthly schedule is_this_day? should not match incorrect day of month' do
    assert_equal false, @monthly.is_this_day?(Date.parse('2024-05-13'))
  end

end
