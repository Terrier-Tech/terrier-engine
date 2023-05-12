import {DateLiteral} from "./schema"

////////////////////////////////////////////////////////////////////////////////
// Columns
////////////////////////////////////////////////////////////////////////////////

export type ColumnRef = {
    name: string
    alias?: string
    grouped?: boolean
    function?: string
}


////////////////////////////////////////////////////////////////////////////////
// Where Clauses
////////////////////////////////////////////////////////////////////////////////

type BaseWhere = {
    column: string
}

export const DirectOperators = ['eq', 'ne', 'ilike'] as const
export type DirectOperator = typeof DirectOperators[number]

export type DirectWhere = BaseWhere & {
    where_type: 'direct'
    operator: DirectOperator
    value: string
}

export type DateRangeWhere = BaseWhere & {
    where_type: 'date_range'
    min?: DateLiteral
    max?: DateLiteral
}

export type InclusionWhere = BaseWhere & {
    where_type: 'inclusion'
    in: string[]
}

export type OrWhere = {
    column: 'or'
    where_type: 'or'
    where: WhereClause[]
}

export type WhereClause = DirectWhere | DateRangeWhere | InclusionWhere | OrWhere


////////////////////////////////////////////////////////////////////////////////
// Tables
////////////////////////////////////////////////////////////////////////////////

export type TableRef = {
    model: string
    columns: ColumnRef[]
    joins?: JoinedTableRef[]
    aggregates?: AggTableRef[]
    where?: WhereClause[]
}


export type AggTableRef = TableRef & {
    foreign_key?: string
}

export type JoinedTableRef = TableRef & {
    join_type: 'inner' | 'left'
    foreign_key?: string
}


////////////////////////////////////////////////////////////////////////////////
// Query
////////////////////////////////////////////////////////////////////////////////

export type Query = {
    from: TableRef
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
        where: [
            {
                where_type: 'date_range',
                column: 'time',
                min: '2022-01-01',
                max: '2022-12-31'
            },
            {
                where_type: 'inclusion',
                column: 'status',
                in: ['active', 'complete']
            }
        ],
        joins: [
            {
                model: 'Location',
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
                where: [
                    {
                        where_type: 'direct',
                        column: 'zip',
                        operator: 'eq',
                        value: '55122'
                    }
                ],
                joins: [
                    {
                        model: 'branch',
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
}
console.log(query)
