import {TableRef} from "./tables"
import api, {ApiResponse} from "../../terrier/api"


////////////////////////////////////////////////////////////////////////////////
// Query
////////////////////////////////////////////////////////////////////////////////

export type Query = {
    id: string
    name: string
    notes: string
    from: TableRef
}


////////////////////////////////////////////////////////////////////////////////
// Validation
////////////////////////////////////////////////////////////////////////////////

/**
 * Type for the response to a server-side query validation.
 */
export type QueryValidation = ApiResponse & {
    query: Query
    sql?: string
    sql_html?: string
    explain?: string
    error?: string
    error_html?: string
}

/**
 * Has the server validate the given query and generate SQL for it.
 * @param query
 */
async function validate(query: Query): Promise<QueryValidation> {
    return await api.post<QueryValidation>("/data_dive/validate_query.json", {query})
}


////////////////////////////////////////////////////////////////////////////////
// Preview
////////////////////////////////////////////////////////////////////////////////

export type QueryResultRow = Record<string, any>

const ColumnTypes = ['string', 'integer', 'float', 'date', 'datetime'] as const

export type ColumnType = typeof ColumnTypes[number]

export type QueryResultColumn = {
    name: string
    type: ColumnType
}

/**
 * Type of the result of running the query on the server.
 */
export type QueryResult = ApiResponse & {
    rows?: QueryResultRow[]
    columns?: QueryResultColumn[]
}

/**
 * Executes the query on the server with a reasonable limit suitable for previewing the results.
 * @param query
 */
async function preview(query: Query): Promise<QueryResult> {
    return await api.post<QueryResult>("/data_dive/preview_query.json", {query})
}



////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Queries = {
    validate,
    preview
}

export default Queries
