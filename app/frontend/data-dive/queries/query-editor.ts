import {PartTag} from "tuff-core/parts"
import Queries, {Query, QueryResult, QueryValidation} from "./queries"
import Tables, {FromTableView} from "./tables"
import {Logger} from "tuff-core/logging"
import QueryForm, {QuerySettings, QuerySettingsColumns} from "./query-form"
import DiveEditor, {DiveEditorState} from "../dives/dive-editor"
import Objects from "tuff-core/objects"
import {messages} from "tuff-core"
import Html from "tuff-core/html"
import ContentPart from "../../terrier/parts/content-part";
import {TabContainerPart} from "../../terrier/tabs";

const log = new Logger("QueryEditor")


////////////////////////////////////////////////////////////////////////////////
// Keys
////////////////////////////////////////////////////////////////////////////////

const validationKey = messages.typedKey<QueryValidation>()


////////////////////////////////////////////////////////////////////////////////
// Settings Part
////////////////////////////////////////////////////////////////////////////////

class SettingsPart extends ContentPart<SubEditorState> {

    form!: QueryForm

    async init() {
        this.form = this.makePart(QueryForm, {query: Objects.slice(this.state.query, ...QuerySettingsColumns)})
    }


    get parentClasses(): Array<string> {
        return ['tt-flex', 'column', 'gap']
    }

    renderContent(parent: PartTag) {
        parent.part(this.form)
        parent.div('.tt-flex.justify-end', row => {
            row.a('.alert.tt-flex', a => {
                a.i('.glyp-delete')
                a.span({text: "Delete"})
            }).emitClick(DiveEditor.deleteQueryKey, {id: this.state.query.id})
        })
    }


}


////////////////////////////////////////////////////////////////////////////////
// SQL Part
////////////////////////////////////////////////////////////////////////////////

class SqlPart extends ContentPart<SubEditorState> {

    validation?: QueryValidation

    setValidation(validation: QueryValidation) {
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
                row.div({text: 'SQL Goes Here'})
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
            parent.div('.table-container', col => {
                Queries.renderPreview(col, this.result!)
            })
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
    sqlPart!: SqlPart
    previewPart!: PreviewPart

    updatePreviewKey = messages.untypedKey()

    async init() {
        const query = this.state.query

        log.info("Initializing query editor", query)

        this.tabs = this.makePart(TabContainerPart, {side: 'left'})
        this.settingsPart = this.tabs.upsertTab({key: 'settings', title: 'Settings', icon: 'glyp-settings'},
            SettingsPart, {editor: this, query})


        this.listenMessage(QueryForm.settingsChangedKey, m => {
            log.info(`Query settings changed`, m.data)
            this.updateSettings(m.data)
        })

        this.sqlPart = this.tabs.upsertTab({key: 'sql', title: 'SQL', icon: 'glyp-code'},
            SqlPart, {editor: this, query})

        this.previewPart = this.tabs.upsertTab({key: 'preview', title: 'Preview', icon: 'glyp-table', classes: ['no-padding'], click: {key: this.updatePreviewKey}},
            PreviewPart, {editor: this, query})

        this.tableEditor = this.makePart(FromTableView, {schema: this.state.schema, table: this.state.query.from})

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
            this.showToast(`Copied '${m.data.value}' to clipboard`, {color: 'primary'})
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
        const res = await Queries.validate(this.state.query)
        log.info(`Query validated`, res)
        this.emitMessage(validationKey, res)
        this.sqlPart.setValidation(res)
        this.dirty()
    }

    async updatePreview() {
        await this.previewPart.updateResult()
        this.tabs.showTab('preview')
    }

    static readonly copyToClipboardKey = messages.typedKey<{ value: string }>()
}
