require 'test_helper'
require 'terrier/data_dive/query_engine'
require_relative '../data/test_dive'

class QueryEngineTest < ActiveSupport::TestCase

  def setup
    @dive = TestDive.get
  end

  test 'joins' do
    query = TestDive.joins
    engine = QueryEngine.new(query)
    builder = engine.to_sql_builder

    start_date = Date.today.beginning_of_year
    end_date = start_date + 1.year
    assert_equal ["work_order.time, work_order.notes, work_order.price, work_order.status", "location.number as location_number, location.display_name as location_name", "created_by.email as created_by_email", "u.first_name as tech_first_name, u.last_name as tech_last_name, u.email as tech_email", "target.name as target_name"], builder.selects
    assert_equal ["work_order.time >= '#{start_date}'", "work_order.time < '#{end_date}'", "work_order.status in ('active','complete')", "location.zip = '55122'", "target.name = 'Rodents'"], builder.clauses
  end

  test "grouping" do
    query = TestDive.grouping
    engine = QueryEngine.new(query)
    builder = engine.to_sql_builder

    assert_equal %w[date_trunc('month',work_order.time) work_order.status location.id u.id], builder.group_bys
  end

  test 'validate' do
    valid_sql = "select count(*) from locations"
    res = QueryEngine.validate_raw_sql valid_sql
    assert_nil res[:error]

    invalid_sql = "select count(*), status, time from work_orders group by status"
    res = QueryEngine.validate_raw_sql invalid_sql
    assert_not_empty res[:error]
    puts "Validation error: #{res[:error]}"

  end

end