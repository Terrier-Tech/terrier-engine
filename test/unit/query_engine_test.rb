require 'test_helper'
require 'terrier/data_dive/query_engine'

class QueryEngineTest < ActiveSupport::TestCase

  def setup
    @from = {
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
                  name: 'name',
                  alias: 'branch_name'
                }
              ]
            }
          ]
        }
      ]
    }
  end

  test 'to_sql' do
    engine = QueryEngine.new({from: @from})
    builder = engine.to_sql_builder
    puts builder.to_sql
  end

end