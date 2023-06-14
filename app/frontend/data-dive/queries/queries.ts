import {TableRef} from "./tables"
import api, {ApiResponse} from "../../terrier/api";


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
// Export
////////////////////////////////////////////////////////////////////////////////

const Queries = {
    validate
}

export default Queries
