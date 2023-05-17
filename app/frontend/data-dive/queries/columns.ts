import {PartTag} from "tuff-core/parts"

////////////////////////////////////////////////////////////////////////////////
// Types
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
// Rendering
////////////////////////////////////////////////////////////////////////////////

function render(parent: PartTag, col: ColumnRef) {
    if (col.function?.length) {
        parent.div('.name').text(`${col.function}(${col.name})`)
    } else {
        parent.div('.name').text(col.name)
    }
    if (col.alias?.length) {
        parent.div('.alias').text(col.alias)
    }
}


////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Columns = {
    render
}

export default Columns