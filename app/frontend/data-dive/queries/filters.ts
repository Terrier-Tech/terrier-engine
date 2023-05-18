import {PartTag} from "tuff-core/parts"
import Dates, {DateRange} from "./dates"

////////////////////////////////////////////////////////////////////////////////
// Types
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
    range: DateRange
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
// Rendering
////////////////////////////////////////////////////////////////////////////////

function operatorDisplay(operator: DirectFilter['operator']): string {
    switch (operator) {
        case "eq":
            return '='
        case 'ne':
            return '!='
        case 'ilike':
            return 'like'
        default:
            return operator
    }
}


function render(parent: PartTag, filter: Filter) {
    switch (filter.filter_type) {
        case 'direct':
            parent.div('.column').text(filter.column)
            parent.div('.operator').text(operatorDisplay(filter.operator))
            parent.div('.value').text(filter.value)
            return
        case 'date_range':
            parent.div('.column').text(filter.column)
            parent.div('.value').text(Dates.rangeDisplay(filter.range))
            return
        case 'inclusion':
            parent.div('.column').text(filter.column)
            parent.div('.operator').text("in")
            parent.div('.value').text(filter.in.join(' | '))
            return
        default:
            parent.div('.empty').text(`${filter.filter_type} filter`)
    }
}


////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Filters = {
    render
}

export default Filters