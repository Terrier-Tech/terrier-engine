import {DateLiteral} from "./schema"

////////////////////////////////////////////////////////////////////////////////
// Columns
////////////////////////////////////////////////////////////////////////////////

export type ColumnRef = {
    name: string
    alias?: string
}

export type AggColumnRef = ColumnRef & {
    function: string
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


////////////////////////////////////////////////////////////////////////////////
// Tables
////////////////////////////////////////////////////////////////////////////////

export type BaseTableRef<C extends ColumnRef> = {
    columns: C[]
    joins: JoinedTableRef[]
    aggregates: AggTableRef[]
}

export type TableRef = BaseTableRef<ColumnRef>

export type AggTableRef = BaseTableRef<AggColumnRef> & {
    belongs_to: TableRef
}

export type JoinedTableRef = BaseTableRef<ColumnRef> & {
    join_type: 'inner' | 'left'
    foreign_key?: string
}