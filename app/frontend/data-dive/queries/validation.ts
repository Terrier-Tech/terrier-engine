import Queries, {Query} from "./queries"
import Columns, {ColumnRef} from "./columns"
import {TableRef} from "./tables"

export type ColumnValidationError = {
    message: string
}

export type QueryClientValidation = {
    columns: ColumnValidationError[]
}

////////////////////////////////////////////////////////////////////////////////
// Client-Side Validation
////////////////////////////////////////////////////////////////////////////////

/**
 * Validates that a query will produce valid SQL.
 */
function validateQuery(query: Query): QueryClientValidation {

    const validation: QueryClientValidation = {
        columns: []
    }

    function addColumnError(col: ColumnRef, message: string) {
        const error = {message}
        col.errors ||= []
        col.errors.push(error)
        validation.columns.push(error)
    }

    const usedNames: Set<string> = new Set<string>()

    const aggCols: ColumnRef[] = [] // keep track of columns with an aggregate function
    let isGrouped = false
    const groupedTables: Set<TableRef> = new Set()
    Queries.eachColumn(query, (table, col) => {
        // clear the errors
        col.errors = undefined

        // determine if there's an aggregate function
        if (col.function?.length && Columns.functionType(col.function) == 'aggregate') {
            aggCols.push(col)
        }

        // determine if there's a _group by_ in the query
        if (col.grouped) {
            isGrouped = true
            if (col.name == 'id') {
                // ungrouped columns on this table are okay
                groupedTables.add(table)
            }
        }

        // each select name should only be used once
        const selectName = Columns.computeSelectName(table, col)
        if (usedNames.has(selectName)) {
            addColumnError(col, `<strong>${selectName}</strong> has already been selected for a different column`)
        }
        usedNames.add(selectName)
    })

    if (isGrouped) {
        // if the query is grouped, ensure that all other column refs
        // are either grouped, have an aggregate function, or are on a grouped table
        Queries.eachColumn(query, (table, col) => {
            if (!col.grouped && Columns.functionType(col.function) != 'aggregate' && !groupedTables.has(table)) {
                addColumnError(col, `<strong>${col.name}</strong> must be grouped or have an aggregate function`)
            }
        })
    }
    else if (aggCols.length) {
        // if the query isn't grouped, aggregate functions are an error
        aggCols.forEach(col => {
            addColumnError(col, `<strong>${col.name}</strong> has an aggregate function but the query isn't grouped`)
        })
    }

    return validation
}


////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Validation = {
    validateQuery
}
export default Validation