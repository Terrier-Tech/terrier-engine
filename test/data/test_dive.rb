module TestDive

  def self.get
    {
      id: 'test',
      name: "Test",
      query_data: {queries: [self.order_details, self.order_summary]}
    }
  end

  def self.order_details
    {
      id: 'order_details',
      name: 'Order Details',
      from: {
        model: 'WorkOrder',
        columns: [
          {
            name: 'id'
          },
          {
            name: 'time'
          },
          {
            name: 'notes',
            alias: "Order Notes"
          },
          {
            name: 'price',
            alias: 'Order Price'
          },
          {
            name: 'status'
          }
        ],
        filters: [
          {
            filter_type: 'date_range',
            column: 'time',
            range: {
              period: 'year',
              relative: 0
            }
          },
          {
            filter_type: 'inclusion',
            column: 'status',
            in: ['active', 'complete']
          }
        ],
        joins: {
          "location": {
            model: 'Location',
            prefix: 'location_',
            belongs_to: 'location',
            join_type: 'inner',
            columns: [
              {
                name: 'number'
              },
              {
                name: 'display_name',
                alias: 'name'
              }
            ],
            filters: [
              {
                filter_type: 'direct',
                column: 'zip',
                operator: 'ne',
                value: '55122',
                editable: 'required',
                edit_label: 'Zip Code'
              }
            ],
            joins: {
              "created_by": {
                model: 'User',
                belongs_to: 'created_by',
                join_type: 'left',
                columns: [
                  {
                    name: 'email',
                    alias: 'Created By E-Mail'
                  }
                ]
              }
            }
          },
          "user": {
            model: 'User',
            belongs_to: 'user',
            join_type: 'inner',
            columns: [
              {
                name: 'first_name',
                alias: 'First Name'
              },
              {
                name: 'last_name',
                alias: 'Last Name'
              },
              {
                name: 'email',
                alias: 'Tech E-Mail'
              }
            ]
          },
          "target": {
            model: 'Target',
            belongs_to: 'target',
            join_type: 'inner',
            columns: [
              {
                name: 'name',
                alias: 'Target'
              }
            ],
            filters: [
              {
                filter_type: 'direct',
                column: 'name',
                operator: 'eq',
                value: 'Rodents'
              }
            ]
          }
        }
      }
    }
  end

  def self.order_summary
    {
      id: 'order_summary',
      name: 'Order Summary',
      from: {
        model: 'WorkOrder',
        columns: [
          {
            name: 'time',
            grouped: true,
            function: 'month',
            alias: 'month'
          },
          {
            name: 'id',
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
            range: {
              period: 'month',
              relative: -1
            }
          }
        ],
        joins: {
          "location": {
            model: 'Location',
            belongs_to: 'location',
            join_type: 'inner',
            columns: [
              {
                name: 'id',
                grouped: true
              },
              {
                name: 'number',
                alias: 'location_number'
              }
            ]
          },
          "user": {
            model: 'User',
            belongs_to: 'user',
            join_type: 'inner',
            columns: [
              {
                name: 'id',
                grouped: true
              },
              {
                name: 'first_name',
                alias: 'user_name'
              }
            ]
          }
        }
      }
    }
  end

end