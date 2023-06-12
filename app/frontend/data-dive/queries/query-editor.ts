import {DdContentPart, DdTabContainerPart} from "../dd-parts"
import {PartTag} from "tuff-core/parts"
import {Query} from "./queries"
import {FromTableView} from "./tables"
import {Logger} from "tuff-core/logging"
import QueryForm, {QuerySettings, QuerySettingsColumns} from "./query-form"
import {DiveEditorState} from "../dives/dive-editor"
import Objects from "tuff-core/objects"

const log = new Logger("QueryEditor")


////////////////////////////////////////////////////////////////////////////////
// Settings Part
////////////////////////////////////////////////////////////////////////////////

class SettingsPart extends DdContentPart<SubEditorState> {

    form!: QueryForm

    async init() {
        this.form = this.makePart(QueryForm, {query: Objects.slice(this.state.query, ...QuerySettingsColumns)})
    }

    renderContent(parent: PartTag) {
        parent.part(this.form)
    }


}


////////////////////////////////////////////////////////////////////////////////
// SQL Part
////////////////////////////////////////////////////////////////////////////////

class SqlPart extends DdContentPart<SubEditorState> {

    renderContent(parent: PartTag) {
        parent.div({text: 'SQL'})
    }


}


////////////////////////////////////////////////////////////////////////////////
// Preview Part
////////////////////////////////////////////////////////////////////////////////

class PreviewPart extends DdContentPart<SubEditorState> {

    renderContent(parent: PartTag) {
        parent.div({text: 'Preview'})
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

export default class QueryEditor extends DdContentPart<QueryEditorState> {

    tableEditor!: FromTableView
    tabs!: DdTabContainerPart
    settingsPart!: SettingsPart
    sqlPart!: SqlPart
    previewPart!: PreviewPart

    async init() {
        const query = this.state.query

        log.info("Initializing query editor", query)

        this.tabs = this.makePart(DdTabContainerPart, {side: 'left'})
        this.settingsPart = this.tabs.upsertTab({key: 'settings', title: 'Settings', icon: 'glyp-settings'},
            SettingsPart, {editor: this, query})


        this.listenMessage(QueryForm.settingsChangedKey, m => {
            log.info(`Query settings changed`, m.data)
            this.updateSettings(m.data)
        })

        this.sqlPart = this.tabs.upsertTab({key: 'sql', title: 'SQL', icon: 'glyp-code'},
            SqlPart, {editor: this, query})
        this.previewPart = this.tabs.upsertTab({key: 'preview', title: 'Preview', icon: 'glyp-table'},
            PreviewPart, {editor: this, query})

        this.tableEditor = this.makePart(FromTableView, {schema: this.state.schema, table: this.state.query.from})
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

}
