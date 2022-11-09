require 'test_helper'

class DatePeriodTest < ActiveSupport::TestCase

  test 'parse year' do
    p = DatePeriod.parse '2022'
    assert_equal '2022-01-01', p.start_date.to_s
    assert_equal '2023-01-01', p.end_date.to_s
    assert_equal p.to_s, '2022'
  end

  test 'parse year range' do
    p = DatePeriod.parse '2022:2023'
    assert_equal '2022-01-01', p.start_date.to_s
    assert_equal '2024-01-01', p.end_date.to_s
    assert_equal p.to_s, '2022:2023'
  end

  test 'parse month' do
    p = DatePeriod.parse '2022-10'
    assert_equal '2022-10-01', p.start_date.to_s
    assert_equal '2022-11-01', p.end_date.to_s
    assert_equal p.to_s, '2022-10'
  end

  test 'parse day' do
    p = DatePeriod.parse '2022-10-13'
    assert_equal '2022-10-13', p.start_date.to_s
    assert_equal '2022-10-14', p.end_date.to_s
    assert_equal p.to_s, '2022-10-13'
  end

  test 'parse date range' do
    p = DatePeriod.parse '2022-10-13:2022-10-22'
    assert_equal '2022-10-13', p.start_date.to_s
    assert_equal '2022-10-23', p.end_date.to_s
    assert_equal p.to_s, '2022-10-13:2022-10-22'
  end

end