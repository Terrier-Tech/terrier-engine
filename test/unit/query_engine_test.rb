require 'test_helper'
require 'terrier/data_dive/query_engine'

class QueryEngineTest < ActiveSupport::TestCase

  def setup

  end

  test 'basic joins' do
    from = {
      model: 'WorkOrder',
      columns: [{
                  name: 'time'
                }],
      filters: [
        {
          filter_type: 'date_range',
          column: 'time',
          min: '2022-01-01',
          max: '2022-12-31'
        },
        {
          filter_type: 'inclusion',
          column: 'status',
          in: ['active', 'complete']
        }
      ],
      joins: [
        {
          belongs_to: 'location',
          join_type: 'inner',
          columns: [
            {
              name: 'number',
              alias: 'location_number'
            },
            {
              name: 'display_name',
              alias: 'location_name'
            }
          ],
          filters: [
            {
              filter_type: 'direct',
              column: 'zip',
              operator: 'eq',
              value: '55122',
              editable: 'required',
              edit_label: 'Zip Code'
            }
          ],
          joins: [
            {
              belongs_to: 'created_by',
              join_type: 'left',
              columns: [
                {
                  name: 'email',
                  alias: 'created_by_email'
                }
              ]
            }
          ]
        }
      ]
    }

    engine = QueryEngine.new({from: from})
    builder = engine.to_sql_builder

    assert_equal ["work_order.time", "location.number as location_number, location.display_name as location_name", "created_by.email as created_by_email"], builder.selects
    assert_equal ["work_order.time >= '2022-01-01'", "work_order.time < '2023-01-01'", "work_order.status in ('active','complete')", "location.zip = '55122'"], builder.clauses
  end

  test "grouping" do
    from = {
      model: 'WorkOrder',
      columns: [
        {
          name: 'time',
          grouped: true,
          function: 'month',
          alias: 'month'
        },
        {
          name: '*',
          function: 'count'
        },
        {
          name: 'status',
          grouped: true
        }
      ],
      filters: [
        {
          filter_type: "date_range",
          column: 'time',
          min: "2023-01-01"
        }
      ],
      joins: [
        {
          belongs_to: 'location',
          join_type: 'inner',
          columns: [
            {
              name: 'id',
              grouped: true
            }
          ]
        }
      ]
    }

    engine = QueryEngine.new({ from: from })
    builder = engine.to_sql_builder
    puts builder.to_sql.bold

    assert_equal ["date_trunc('month',work_order.time)", "work_order.status", "location.id"], builder.group_bys
  end

end