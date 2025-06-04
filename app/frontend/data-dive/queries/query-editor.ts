import { PartTag } from "tuff-core/parts"
import Queries, { Query, QueryResult, QueryServerValidation } from "./queries"
import Tables, { FromTableView } from "./tables"
import { Logger } from "tuff-core/logging"
import QueryForm, { QuerySettings, QuerySettingsColumns } from "./query-form"
import DiveEditor, { DiveEditorState } from "../dives/dive-editor"
import Objects from "tuff-core/objects"
import Html from "tuff-core/html"
import ContentPart from "../../terrier/parts/content-part"
import { TabContainerPart } from "../../terrier/tabs"
import Messages from "tuff-core/messages"
import Validation, { QueryClientValidation } from "./validation"
import ColumnOrderModal from "./column-order-modal"
import RowOrderModal from "./row-order-modal"
import Columns from "./columns"

const log = new Logger("QueryEditor")


////////////////////////////////////////////////////////////////////////////////
// Keys
////////////////////////////////////////////////////////////////////////////////

const validationKey = Messages.typedKey<QueryServerValidation>()


////////////////////////////////////////////////////////////////////////////////
// Settings Part
////////////////////////////////////////////////////////////////////////////////

class SettingsPart extends ContentPart<SubEditorState> {

    form!: QueryForm

    async init() {
        this.form = this.makePart(QueryForm, { query: Objects.slice(this.state.query, ...QuerySettingsColumns) })
    }


    get parentClasses(): Array<string> {
        return ['tt-flex', 'column', 'gap']
    }

    renderContent(parent: PartTag) {
        parent.part(this.form)
        parent.div('.tt-flex.gap.align-center.justify-end', row => {
            row.div('.dd-hint.glyp-hint', hint => {
                hint.div('.title').text("These settings only apply to this query, not the dive as a whole")
            })
            row.a('.alert.tt-flex', a => {
                a.i('.glyp-delete')
                a.span({ text: "Delete" })
            }).emitClick(DiveEditor.deleteQueryKey, { id: this.state.query.id })
        })
    }


}


////////////////////////////////////////////////////////////////////////////////
// Sorting Part
////////////////////////////////////////////////////////////////////////////////

class SortingPart extends ContentPart<SubEditorState> {
    sortColumnsKey = Messages.untypedKey()
    sortRowsKey = Messages.untypedKey()

    async init() {
        this.onClick(this.sortColumnsKey, _ => {
            log.info("Sorting columns")
            this.state.query.columns = Array.from(Queries.tableColumns(this.state.query.from)).
                map(({ table, column }) => Columns.computeSelectName(table, column))
            this.app.showModal(ColumnOrderModal, {
                query: this.state.query,
                onSorted: (newColumns) => {
                    this.state.query.columns = newColumns
                    this.state.editor.dirty()
                    this.emitMessage(DiveEditor.diveChangedKey, {})
                }
            })
        })

        this.onClick(this.sortRowsKey, _ => {
            log.info("Sorting rows")
            this.app.showModal(RowOrderModal, {
                query: this.state.query,
                onSorted: (newOrderBys) => {
                    log.info(`New row sort order`, newOrderBys)
                    this.state.query.order_by = newOrderBys
                    this.state.editor.dirty()
                    this.emitMessage(DiveEditor.diveChangedKey, {})
                }
            })
        })

    }

    renderContent(parent: PartTag): void {
        const query = this.state.query
        parent.div(".tt-flex.gap.collapsible.tt-typography", row => {
            row.div(".tt-flex.gap.column.full-height", col => {
                col.h3(".glyp-columns").text("Columns")
                col.div(".dive-query-columns.stretch", colList => {
                    if (query.columns?.length) {
                        for (const c of query.columns) {
                            colList.div().text(c)
                        }
                    }
                    else {
                        colList.div(".text-center").text("Unspecified")
                    }
                })
                col.a(".tt-button.shrink", button => {
                    button.i(".glyp-edit")
                    button.span().text("Sort Columns")
                }).emitClick(this.sortColumnsKey)
            })
            row.div(".tt-flex.gap.column.full-height", col => {
                col.h3(".glyp-rows").text("Rows")
                col.div(".dive-query-order-bys.stretch", orderList => {
                    if (query.order_by?.length) {
                        for (const orderBy of query.order_by) {
                            orderList.div('.order-by', line => {
                                line.div(".column").text(orderBy.column)
                                const dir = orderBy.dir == 'asc' ? 'ascending' : 'descending'
                                line.div(`.dir.glyp-${dir}`).text(dir)
                            })
                        }
                    }
                    else {
                        orderList.div(".text-center").text("Unspecified")
                    }
                })
                col.a(".tt-button.shrink", button => {
                    button.i(".glyp-edit")
                    button.span().text("Sort Rows")
                }).emitClick(this.sortRowsKey)
            })
        })
    }

}



////////////////////////////////////////////////////////////////////////////////
// SQL Part
////////////////////////////////////////////////////////////////////////////////

class SqlPart extends ContentPart<SubEditorState> {

    validation?: QueryServerValidation

    setValidation(validation: QueryServerValidation) {
        this.validation = validation
        this.dirty()
    }

    renderContent(parent: PartTag) {
        parent.div('.dd-sql-output.tt-flex.gap', row => {
            if (this.validation) {
                const validation = this.validation
                row.div('.sql.stretch', col => {
                    if (validation.error_html?.length) {
                        col.class('alert')
                        col.pre().text(validation.error_html)
                    } else if (validation.sql_html) {
                        col.pre().text(validation.sql_html)
                    } else {
                        col.div('.alert.tt-bubble').text(Html.escape(validation.message))
                    }
                })
            }
            else {
                row.div({ text: 'SQL Goes Here' })
            }
        })
    }


}


////////////////////////////////////////////////////////////////////////////////
// Preview Part
////////////////////////////////////////////////////////////////////////////////

class PreviewPart extends ContentPart<SubEditorState> {

    result?: QueryResult

    async updateResult() {
        const query = this.state.query
        log.info(`Generating preview for`, query)
        this.startLoading()
        this.result = await Queries.preview(query)
        this.stopLoading()
        this.dirty()
    }

    async init() {
    }


    get parentClasses(): Array<string> {
        return ['dd-query-preview']
    }

    renderContent(parent: PartTag) {
        if (this.result) {
            if (this.result.status == 'error') {
                parent.div('.tt-bubble.alert').text(this.result.message)
            }
            else if (this.result.columns?.length) {
                parent.div('.table-container', col => {
                    Queries.renderPreview(col, this.result!)
                })
            }
            else {
                // empty query
                parent.div('.dd-hint-container', hintContainer => {
                    hintContainer.div('.dd-hint.centered.glyp-columns')
                        .text("Select at least one column")
                })
            }
        }
        else {
            parent.a('.tt-button.stretch', a => {
                a.i('.glyp-refresh')
                a.span('.title').text("Load Preview")
            }).emitClick(this.state.editor.updatePreviewKey)
        }
    }


}



////////////////////////////////////////////////////////////////////////////////
// Editor
////////////////////////////////////////////////////////////////////////////////

export type QueryEditorState = DiveEditorState & {
    query: Query
}

type SubEditorState = {
    editor: QueryEditor
    query: Query
}

export default class QueryEditor extends ContentPart<QueryEditorState> {

    tableEditor!: FromTableView
    tabs!: TabContainerPart
    settingsPart!: SettingsPart
    sortingPart!: SortingPart
    sqlPart!: SqlPart
    previewPart!: PreviewPart
    clientValidation!: QueryClientValidation

    updatePreviewKey = Messages.untypedKey()

    async init() {
        const query = this.state.query
        this.clientValidation = Validation.validateQuery(query)

        log.info("Initializing query editor", query)

        this.tabs = this.makePart(TabContainerPart, { side: 'left' })
        this.settingsPart = this.tabs.upsertTab({ key: 'settings', title: 'Settings', icon: 'glyp-settings' },
            SettingsPart, { editor: this, query })

        this.sortingPart = this.tabs.upsertTab({ key: 'sorting', title: 'Sorting', icon: 'glyp-sort' },
            SortingPart, { editor: this, query })


        this.listenMessage(QueryForm.settingsChangedKey, m => {
            log.info(`Query settings changed`, m.data)
            this.updateSettings(m.data)
        })

        this.sqlPart = this.tabs.upsertTab({ key: 'sql', title: 'SQL', icon: 'glyp-code' },
            SqlPart, { editor: this, query })

        this.previewPart = this.tabs.upsertTab({ key: 'preview', title: 'Preview', icon: 'glyp-table', classes: ['no-padding'], click: { key: this.updatePreviewKey } },
            PreviewPart, { editor: this, query })

        this.tableEditor = this.makePart(FromTableView, { schema: this.state.schema, queryEditor: this, table: this.state.query.from })

        this.listenMessage(Tables.updatedKey, m => {
            log.info(`Table ${m.data.model} updated`, m.data)
            this.validate()
            this.updatePreview()
        })

        this.onClick(this.updatePreviewKey, async _ => {
            await this.previewPart.updateResult()
        })

        this.onClick(QueryEditor.copyToClipboardKey, async m => {
            log.info(`Copy value to clipboard: ${m.data.value}`)
            await navigator.clipboard.writeText(m.data.value)
            this.showToast(`Copied '${m.data.value}' to clipboard`, { color: 'primary' })
        })

        this.validate().then()
        this.updatePreview().then()
    }


    get parentClasses(): Array<string> {
        return ['dd-query-editor']
    }

    renderContent(parent: PartTag): void {
        parent.div('.dd-query-editor-canvas').part(this.tableEditor)
        parent.div('.dd-query-sub-editors').part(this.tabs)
    }

    updateSettings(settings: QuerySettings) {
        log.info("Updating settings", settings)
        Object.assign(this.state.query, settings)
        this.dirty()
    }

    async validate() {
        // server-side validation
        const res = await Queries.validate(this.state.query)
        log.info(`Query validated`, res)
        this.emitMessage(validationKey, res)
        this.sqlPart.setValidation(res)

        // client-side validation
        this.clientValidation = Validation.validateQuery(this.state.query)
        this.dirty()
    }

    async updatePreview() {
        await this.previewPart.updateResult()
        this.tabs.showTab('preview')
    }

    static readonly copyToClipboardKey = Messages.typedKey<{ value: string }>()
}