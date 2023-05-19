module TestQueries

  def self.joins
    {
      id: 'joins',
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
              min: '2022-01-01',
              max: '2023-01-01'
            }
          },
          {
            filter_type: 'inclusion',
            column: 'status',
            in: ['active', 'complete']
          }
        ],
        joins: [
          {
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
            joins: [
              {
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
            ]
          },
          {
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
          {
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
        ]
      }
    }
  end

  def self.grouping
    {
      id: 'grouping',
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
            range: {
              min: "2023-01-01",
              max: "2024-01-01"
            }
          }
        ],
        joins: [
          {
            model: 'Location',
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
    }
  end

end