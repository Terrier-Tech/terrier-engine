require 'test_helper'
require 'terrier/data_dive/query_engine'
require_relative '../data/test_queries'

class QueryEngineTest < ActiveSupport::TestCase

  def setup

  end

  test 'joins' do
    query = TestQueries.joins
    engine = QueryEngine.new(query)
    builder = engine.to_sql_builder

    assert_equal ["work_order.time, work_order.notes, work_order.price, work_order.status", "location.number as location_number, location.display_name as location_name", "created_by.email as created_by_email", "u.first_name as tech_first_name, u.last_name as tech_last_name, u.email as tech_email", "target.name as target_name"], builder.selects
    assert_equal ["work_order.time >= '2022-01-01'", "work_order.time < '2023-01-01'", "work_order.status in ('active','complete')", "location.zip = '55122'", "target.name = 'Rodents'"], builder.clauses
  end

  test "grouping" do
    query = TestQueries.grouping
    engine = QueryEngine.new(query)
    builder = engine.to_sql_builder

    assert_equal ["date_trunc('month',work_order.time)", "work_order.status", "location.id"], builder.group_bys
  end

end