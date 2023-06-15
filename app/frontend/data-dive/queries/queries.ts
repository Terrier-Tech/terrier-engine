import {TableRef} from "./tables"
import api, {ApiResponse} from "../../terrier/api"
import {PartTag} from "tuff-core/parts"
import {TableCellTag} from "tuff-core/html"
import dayjs from "dayjs";


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

const ColumnTypes = ['string', 'integer', 'float', 'date', 'time',  'dollars'] as const

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
// Preview Rendering
////////////////////////////////////////////////////////////////////////////////

const DateFormat = 'MM/DD/YY'

const TimeFormat = `h:mm A`

function renderCell(td: TableCellTag, col: QueryResultColumn, val: any): any {
    td.class(col.type)
    switch (col.type) {
        case 'date':
            const date = dayjs(val.toString())
            return td.div('.date').text(date.format(DateFormat))
        case 'time':
            const time = dayjs(val.toString())
            td.div('.date').text(time.format(DateFormat))
            return td.div('.time').text(time.format(TimeFormat))
        case 'dollars':
            const dollars = parseFloat(val)
            return td.div('.dollars').text(`\$${dollars}`)
        default:
            td.text(val.toString())
    }
    td.text(val.toString())
}

function renderTable(parent: PartTag, rows: QueryResultRow[], columns: QueryResultColumn[]) {
    parent.table('.dd-query-result', table => {
        // header
        table.thead(thead => {
            thead.tr(tr => {
                for (const col of columns) {
                    tr.th(th => {
                        th.a(col.type).text(col.name)
                    })
                }
            })
        })

        // body
        table.tbody(tbody => {
            for (const row of rows) {
                tbody.tr(tr => {
                    for (const col of columns) {
                        tr.td(td => {
                            const val = row[col.name]
                            if (val) {
                                renderCell(td, col, val)
                            }
                        })
                    }
                })
            }
        })
    })
}

/**
 * Renders a preview table if the result is successful, otherwise an error bubble.
 * @param parent
 * @param result
 */
function renderPreview(parent: PartTag, result: QueryResult) {
    if (result.rows && result.columns) {
        renderTable(parent, result.rows, result.columns)
    } else {
        parent.div('.tt-bubble.alert').text(result.message)
    }
}


////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Queries = {
    validate,
    preview,
    renderPreview
}

export default Queries
