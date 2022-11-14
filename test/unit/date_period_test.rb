require 'test_helper'

class DatePeriodTest < ActiveSupport::TestCase

  test 'parse year' do
    p = DatePeriod.parse '2022'
    assert_equal '2022-01-01', p.start_date.to_s
    assert_equal '2023-01-01', p.end_date.to_s
    assert_equal '2022', p.to_s
    assert_equal '2022', p.display_name
  end

  test 'parse year range' do
    p = DatePeriod.parse '2022:2023'
    assert_equal '2022-01-01', p.start_date.to_s
    assert_equal '2024-01-01', p.end_date.to_s
    assert_equal '2022:2023', p.to_s
    assert_equal '2022-2023', p.display_name
  end

  test 'parse month' do
    p = DatePeriod.parse '2022-10'
    assert_equal '2022-10-01', p.start_date.to_s
    assert_equal '2022-11-01', p.end_date.to_s
    assert_equal '2022-10', p.to_s
    assert_equal 'October 2022', p.display_name
  end

  test 'serialize last n' do
    p = DatePeriod.last_30 '2022-11-09'
    assert_equal '2022-10-10:2022-11-09', p.to_s
    assert_equal '10/10/22 - 11/09/22', p.display_name
    p = DatePeriod.last_7 '2022-11-09'
    assert_equal '2022-11-02:2022-11-09', p.to_s
    assert_equal '11/02/22 - 11/09/22', p.display_name
  end

  test 'parse day' do
    p = DatePeriod.parse '2022-10-13'
    assert_equal '2022-10-13', p.start_date.to_s
    assert_equal '2022-10-14', p.end_date.to_s
    assert_equal '2022-10-13', p.to_s
    assert_equal '10/13/22', p.display_name
  end

  test 'parse date range' do
    p = DatePeriod.parse '2022-10-13:2022-10-22'
    assert_equal '2022-10-13', p.start_date.to_s
    assert_equal '2022-10-23', p.end_date.to_s
    assert_equal '2022-10-13:2022-10-22', p.to_s
    assert_equal '10/13/22 - 10/22/22', p.display_name
  end

  test 'each' do
    period = DatePeriod.parse '2022-10-01:2022-11-14'

    # months
    months = period.each 1.month do |mp|
      mp
    end
    assert_equal 2, months.count
    assert_equal '2022-11-15', months.last.end_date.to_s

    # weeks
    weeks = period.each 1.week do |wp|
      wp
    end
    assert_equal 7, weeks.count
    assert_equal '2022-11-15', weeks.last.end_date.to_s

    # days
    days = period.each 1.day do |dp|
      dp
    end
    assert_equal 45, days.count
    assert_equal days.first.end_date, days.first.start_date + 1.day
    assert_equal '2022-11-15', days.last.end_date.to_s
  end

end