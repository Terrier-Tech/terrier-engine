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

end