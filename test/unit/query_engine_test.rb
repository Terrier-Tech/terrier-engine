require 'test_helper'
require 'terrier/data_dive'
require_relative '../data/test_dive'

class QueryEngineTest < ActiveSupport::TestCase

  def setup
    @dive = TestDive.get
  end

  test 'order_details' do
    query = TestDive.order_details
    engine = DataDive::QueryEngine.new(query)
    builder = engine.to_sql_builder

    start_date = Date.today.beginning_of_year
    end_date = start_date + 1.year
    assert_equal ["work_order.id, work_order.time, work_order.notes as \"Order Notes\", work_order.price as \"Order Price\", work_order.status", "location.number as \"location_number\", location.display_name as \"location_name\"", "created_by.email as \"Created By E-Mail\"", "u.first_name as \"First Name\", u.last_name as \"Last Name\", u.email as \"Tech E-Mail\"", "target.name as \"Target\""], builder.selects
    assert_equal ["work_order.time >= '#{start_date}'", "work_order.time < '#{end_date}'", "work_order.status in ('active','complete')", "location.zip <> '55122'", "target.name = 'Rodents'"], builder.clauses
  end

  test "order_summary" do
    query = TestDive.order_summary
    engine = DataDive::QueryEngine.new(query)
    builder = engine.to_sql_builder

    assert_equal %w[date_trunc('month',work_order.time) work_order.status location.id u.id], builder.group_bys
  end

  test "filter params" do
    query = TestDive.order_summary
    engine = DataDive::QueryEngine.new(query)
    # show that we can override filter values explicitly through the params
    builder = engine.to_sql_builder({'WorkOrder.time#range' => '2022'})
    assert_includes builder.clauses, "work_order.time >= '2022-01-01'"
    assert_includes builder.clauses, "work_order.time < '2023-01-01'"
  end

  test 'validate' do
    valid_sql = "select count(*) from locations"
    res = DataDive::QueryEngine.validate_raw_sql valid_sql
    assert_nil res[:error]

    invalid_sql = "select count(*), status, time from work_orders group by status"
    res = DataDive::QueryEngine.validate_raw_sql invalid_sql
    assert_not_empty res[:error]

  end

  test 'column types' do
    query = TestDive.order_details
    engine = DataDive::QueryEngine.new(query)

    columns = engine.compute_column_metadata
    columns.each do |name, col|
      puts "\n\n=== #{name} ===\n"
      ap col.as_json
    end
    assert_equal 12, columns.size

    assert_equal 'cents', columns['Order Price'].type
  end

end