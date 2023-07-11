import {TableRef} from "./tables"
import api, {ApiResponse} from "../../terrier/api"
import {PartTag} from "tuff-core/parts"
import {TableCellTag} from "tuff-core/html"
import dayjs from "dayjs"
import QueryEditor from "./query-editor"
import TerrierPart from "../../terrier/parts/terrier-part"
import Schema, {ModelDef, SchemaDef} from "../../terrier/schema"
import {arrays, messages, strings} from "tuff-core"
import {Logger} from "tuff-core/logging"
import inflection from "inflection";

const log = new Logger("Queries")


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
// Inputs
////////////////////////////////////////////////////////////////////////////////



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
        case 'string':
            if (col.name.endsWith('id')) {
                const id = val.toString()
                td.a('.id')
                    .data({tooltip: id})
                    .text(`...${id.substring(id.length-6)}`)
                    .emitClick(QueryEditor.copyToClipboardKey, {value: id})
            }
            else {
                td.text(val.toString())
            }
            return
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
                    tr.th(col.type, th => {
                        th.a().text(col.name)
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
// Model Picker
////////////////////////////////////////////////////////////////////////////////

export type QueryModelPickerState = {
    schema: SchemaDef
}

/**
 * Presents a bunch of radio buttons to select the model for a query.
 */
export class QueryModelPicker extends TerrierPart<QueryModelPickerState> {

    pickedKey = messages.typedKey<{ model: string }>()
    model?: ModelDef

    async init() {

        this.onChange(this.pickedKey, m => {
            log.info(`Picked model ${m.data.model}`)
            this.model = this.state.schema.models[m.data.model]
        })
    }


    get parentClasses(): Array<string> {
        return ['dd-query-model-picker', 'padded', 'tt-inset-box', 'tt-flex', 'column', 'gap']
    }

    renderModelOption(parent: PartTag, model: ModelDef) {
        parent.label('.model-option', label => {
            label.input({type: 'radio', name: `new-query-model-${this.id}`, value: model.name})
                .emitChange(this.pickedKey, {model: model.name})
            label.div(col => {
                const name = inflection.pluralize(strings.titleize(model.name))
                col.div('.name').text(name)
                if (model.metadata?.description) {
                    col.div('.description').text(model.metadata.description)
                }
            })
        })
    }

    render(parent: PartTag): any {
        parent.h2('.centered', h2 => {
            h2.i('.glyp-table')
            h2.span().text("Select a Table")
        })
        parent.p('.caption').text("The table forms the basis of the query. Other tables can be joined into the query but they will all flow from the one selected below.")
        parent.div('.tt-flex.gap.collapsible', row => {
            row.div('.stretch.tt-flex.column.gap', col => {
                const commonModels = Schema.commonModels(this.state.schema)
                if (commonModels.length) {
                    col.h3(h3 => {
                        h3.i('.glyp-refresh')
                        h3.span().text("Common Tables")
                    })
                    for (const model of arrays.sortBy(commonModels, 'name')) {
                        this.renderModelOption(col, model)
                    }
                }
            })

            row.div('.stretch.tt-flex.column.gap', col => {
                const uncommonModels = Schema.uncommonModels(this.state.schema)
                if (uncommonModels.length) {
                    col.h3(h3 => {
                        h3.i('.glyp-pending')
                        h3.span().text("Other Tables")
                    })
                    for (const model of arrays.sortBy(uncommonModels, 'name')) {
                        this.renderModelOption(col, model)
                    }
                }
            })
        })
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
