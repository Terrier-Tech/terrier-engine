module TestDive

  def self.get
    {
      name: "Test",
      queries: [self.order_summary, self.order_details]
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
            name: 'time'
          },
          {
            name: 'notes'
          },
          {
            name: 'price'
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
            joins: {
              "created_by": {
                model: 'User',
                belongs_to: 'created_by',
                join_type: 'left',
                columns: [
                  {
                    name: 'email',
                    alias: 'created_by_email'
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
                alias: 'tech_first_name'
              },
              {
                name: 'last_name',
                alias: 'tech_last_name'
              },
              {
                name: 'email',
                alias: 'tech_email'
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
                alias: 'target_name'
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