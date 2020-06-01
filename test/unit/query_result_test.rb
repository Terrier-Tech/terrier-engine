require 'test_helper'

class QueryResultTest < ActiveSupport::TestCase

  test 'result' do

    num = 10

    raw = 0.upto(num-1).map do |i|
      {
          'name' => "Row #{i}",
          'time' => Time.now+i.minutes,
          'price' => 1000+i,
          'number' => i+3,
          'negative_i' => -i
      }
    end

    result = QueryResult.new raw

    tax_rate = 0.07125
    result.compute_column 'tax' do |row|
      row.price * tax_rate
    end

    assert_equal num, result.count

    first_row = result.first
    assert_equal 'Row 0', first_row.name
    assert_equal 10.0, first_row.price
    assert_in_delta first_row.price*tax_rate, first_row.tax, 0.01
    assert_equal 3, first_row.number
    assert_equal Time, first_row.time.class
    assert_equal Integer, first_row.negative_i.class
  end

end