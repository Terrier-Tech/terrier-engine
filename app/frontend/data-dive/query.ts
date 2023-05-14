import {DateLiteral} from "./schema"

////////////////////////////////////////////////////////////////////////////////
// Columns
////////////////////////////////////////////////////////////////////////////////

/**
 * Possible functions used to aggregate a column.
 */
const AggFunctions = ['count', 'min', 'max'] as const

export type AggFunction = typeof AggFunctions[number]


/**
 * Possible functions used to manipulate a date column.
 */
const DateFunctions = ['year', 'month', 'day'] as const

export type DateFunction = typeof DateFunctions[number]



export type ColumnRef = {
    name: string
    alias?: string
    grouped?: boolean
    function?: AggFunction | DateFunction
}


////////////////////////////////////////////////////////////////////////////////
// Filters
////////////////////////////////////////////////////////////////////////////////

type BaseFilter = {
    column: string
    editable?: 'optional' | 'required'
    edit_label?: string
}

export const DirectOperators = ['eq', 'ne', 'ilike'] as const
export type DirectOperator = typeof DirectOperators[number]

export type DirectFilter = BaseFilter & {
    filter_type: 'direct'
    operator: DirectOperator
    value: string
}

export type DateRangeFilter = BaseFilter & {
    filter_type: 'date_range'
    min?: DateLiteral
    max?: DateLiteral
}

export type InclusionFilter = BaseFilter & {
    filter_type: 'inclusion'
    in: string[]
}

// currently not implemented, but it would be neat
export type OrFilter = {
    column: 'or'
    filter_type: 'or'
    where: Filter[]
}

export type Filter = DirectFilter | DateRangeFilter | InclusionFilter | OrFilter


////////////////////////////////////////////////////////////////////////////////
// Tables
////////////////////////////////////////////////////////////////////////////////

export type TableRef = {
    columns?: ColumnRef[]
    joins?: JoinedTableRef[]
    filters?: Filter[]
}

export type FromTableRef = TableRef & {
    model: string
}

export type JoinedTableRef = TableRef & {
    join_type: 'inner' | 'left'
    belongs_to: string
}


////////////////////////////////////////////////////////////////////////////////
// Query
////////////////////////////////////////////////////////////////////////////////

export type Query = {
    from: FromTableRef
}


////////////////////////////////////////////////////////////////////////////////
// Examples
////////////////////////////////////////////////////////////////////////////////

const query: Query = {
    from: {
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
                        editLabel: 'Zip Code'
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
}
console.log(query)

const groupedQuery: Query = {
    from: {
        model: 'WorkOrder',
        columns: [
            {
                name: 'time',
                grouped: true,
                function: 'month'
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
}
console.log(groupedQuery)