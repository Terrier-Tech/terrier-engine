import {PartTag} from "tuff-core/parts"
import {DirectFilter, Filter} from "./query"


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
            parent.div('.operator').text("between")
            parent.div('.value').text(`${filter.min} and ${filter.max}`)
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

const Filters = {
    render
}

export default Filters