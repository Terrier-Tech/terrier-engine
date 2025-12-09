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
    assert_equal ['work_order.id as "id"', 'work_order.time as "Order Time"', 'work_order.notes as "Order Notes"', 'work_order.price as "Order Price"', 'work_order.status as "status"', 'location.number as "location_number"', 'location.display_name as "location_name"', 'created_by.email as "Created By E-Mail"', 'u.first_name as "First Name"', 'u.last_name as "Last Name"', 'u.email as "Tech E-Mail"', 'target.name as "Target"'], builder.selects
    assert_equal ["work_order.time >= '#{start_date}'", "work_order.time < '#{end_date}'", "work_order.status in ('active','complete')", "location.zip <> '55122'", "target.name = 'Rodents'"], builder.clauses
    assert_equal ['"location_id" asc', '"Order Time" desc'], builder.order_bys
  end

  test "order_summary" do
    query = TestDive.order_summary
    engine = DataDive::QueryEngine.new(query)
    builder = engine.to_sql_builder

    assert_equal %w[date_trunc('month',work_order.time) work_order.status location.id u.id], builder.group_bys

    # ensure the select statements are in the correct order
    # which is the query's "columns" order followed by the natural order of the rest of the columns in the selects
    selects = [
      'location.number as "location_number"', 'work_order.status as "status"', 'to_char(date_trunc(\'month\',work_order.time),\'YYYY-MM\') as "month"', 'count(work_order.id) as "count"', 'u.first_name as "user_name"', # these are in "columns"
      'max(time) as "max_time"', # this is a raw select
      'location.id as "id"', 'u.id as "id"' # these two aren't in "columns"
    ]
    assert_equal selects, builder.selects
  end

  test "filter params" do
    query = TestDive.order_summary
    engine = DataDive::QueryEngine.new(query)

    # show that we can override filter values explicitly through the params
    builder = engine.to_sql_builder({'date_range_1' => '2022'})
    assert_includes builder.clauses, "work_order.time >= '2022-01-01'"
    assert_includes builder.clauses, "work_order.time < '2023-01-01'"

    # explicit date ranges have an explicit max, so this is equivalent to a '2022-04-01'
    builder = engine.to_sql_builder({ 'date_range_1' => '2022-04-01:2022-04-02' })
    assert_includes builder.clauses, "work_order.time >= '2022-04-01'"
    assert_includes builder.clauses, "work_order.time < '2022-04-02'"

    # present operator
    query = TestDive.employees
    engine = DataDive::QueryEngine.new(query)
    builder = engine.to_sql_builder
    assert_includes builder.clauses, "u.address2 IS NOT NULL"
    assert_includes builder.clauses, "length(u.address2) > 0"
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
    engine = DataDive::QueryEngine.new query

    columns = engine.compute_column_metadata
    assert_equal 12, columns.size

    assert_equal 'cents', columns['Order Price'].type
  end


  test 'array filters' do
    query = TestDive.employees
    engine = DataDive::QueryEngine.new query
    res = engine.validate
    assert_nil res[:error]

    # contains filters treat comma-separated strings as arrays and test their inclusion in the given column
    builder = engine.to_sql_builder({'tags_1' => 'Dynamic'})
    assert_includes builder.clauses, "u.tags @> '{\"Dynamic\"}'"
    builder = engine.to_sql_builder({'tags_1' => 'Dynamic, Engineer'})
    assert_includes builder.clauses, "u.tags @> '{\"Dynamic\", \"Engineer\"}'"

    # any filters should match on any value shared between the two arrays
    query = TestDive.any_array_filter
    engine = DataDive::QueryEngine.new query
    builder = engine.to_sql_builder({ 'tags_1' => 'Dynamic, Engineer' })
    assert_includes builder.clauses, "u.tags && '{\"Dynamic\", \"Engineer\"}'"
  end

  test 'comma-separated filters' do
    query = TestDive.employees
    engine = DataDive::QueryEngine.new query
    res = engine.validate
    assert_nil res[:error]

    builder = engine.to_sql_builder({ 'role_1' => "foo, bar" })
    assert_includes builder.clauses, "u.role IN ('foo','bar')"

  end


end