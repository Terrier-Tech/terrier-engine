import Schema, {SchemaDef} from "../../terrier/schema"
import {PartTag} from "tuff-core/parts"
import Dives from "./dives"
import {Query, QueryModelPicker} from "../queries/queries"
import QueryEditor from "../queries/query-editor"
import {Logger} from "tuff-core/logging"
import QueryForm from "../queries/query-form"
import {arrays, messages} from "tuff-core"
import {TabContainerPart} from "../../terrier/tabs"
import PagePart from "../../terrier/parts/page-part"
import ContentPart from "../../terrier/parts/content-part"
import {ModalPart} from "../../terrier/modals"
import {DdDive} from "../gen/models"
import Ids from "../../terrier/ids"
import Db from "../dd-db"
import DdSession from "../dd-session"
import {DiveRunModal} from "./dive-runs"
import Nav from "tuff-core/nav";

const log = new Logger("DiveEditor")


////////////////////////////////////////////////////////////////////////////////
// Editor
////////////////////////////////////////////////////////////////////////////////

export type DiveEditorState = {
    schema: SchemaDef
    dive: DdDive
    session: DdSession
}

export default class DiveEditor extends ContentPart<DiveEditorState> {

    tabs!: TabContainerPart

    newQueryKey = messages.untypedKey()

    static readonly diveChangedKey = messages.untypedKey()

    queries = new Array<Query>()

    async init() {
        this.tabs = this.makePart(TabContainerPart, {side: 'top'})

        this.tabs.addBeforeAction({
            title: 'Queries:',
            icon: 'glyp-data_dive_query'
        })
        this.tabs.addAfterAction({
            title: "Add Another Query",
            classes: ['dd-hint', 'arrow-right'],
            tooltip: "Each query represents a separate tab in the resulting spreadsheet",
            click: {key: this.newQueryKey}
        })
        this.tabs.addAfterAction({
            icon: 'glyp-plus_outline',
            classes: ['new-query'],
            click: {key: this.newQueryKey}
        })

        this.queries = this.state.dive.query_data?.queries || []
        for (const query of this.queries) {
            this.addQuery(query)
        }

        this.listenMessage(QueryForm.settingsChangedKey, m => {
            const query = m.data
            log.info(`Query settings changed`, query)
            this.tabs.updateTab({key: query.id, title: query.name})
        })

        this.onClick(this.newQueryKey, _ => {
            this.app.showModal(NewQueryModal, {editor: this as DiveEditor, schema: this.state.schema})
        })

        this.onClick(DiveEditor.deleteQueryKey, m => {
            this.app.confirm({title: "Delete Query", icon: 'glyp-delete', body: "Are you sure you want to delete this query?"}, () => {
                this.deleteQuery(m.data.id)
            })
        })
    }

    addQuery(query: Query) {
        const state = {...this.state, query}
        this.tabs.upsertTab({key: query.id, title: query.name}, QueryEditor, state)
    }

    deleteQuery(id: string) {
        log.info(`Deleting query ${id}`)
        if (arrays.deleteIf(this.queries, q => q.id == id) > 0) {
            this.tabs.removeTab(id)
            this.dirty()
        }
    }

    get parentClasses(): Array<string> {
        return ['dd-dive-editor']
    }

    renderContent(parent: PartTag) {
        parent.part(this.tabs)
    }

    static readonly deleteQueryKey = messages.typedKey<{ id: string }>()

    async serialize(): Promise<DdDive> {
        const queries = this.queries
        return {...this.state.dive, query_data: {queries}}
    }

}


export class DiveEditorPage extends PagePart<{id: string}> {

    editor!: DiveEditor
    session!: DdSession

    saveKey = messages.untypedKey()
    discardKey = messages.untypedKey()
    runKey = messages.untypedKey()

    async init() {
        log.info(`Loading dive ${this.state.id}`)

        const schema = await Schema.get()
        this.session = await DdSession.get()
        const dive = await Dives.get(this.state.id)
        this.editor = this.makePart(DiveEditor, {schema, dive, session: this.session})

        this.mainContentWidth = 'wide'

        this.addBreadcrumb({
            title: "Dives",
            icon: 'glyp-data_dives',
            href: "/data_dive"
        })
        this.addBreadcrumb({
            title: dive.name,
            icon: 'glyp-data_dive'
        })

        this.addAction({
            title: 'Discard',
            icon: 'glyp-cancelled',
            classes: ['discard-dive-action'],
            click: {key: this.discardKey}
        }, 'tertiary')

        this.addAction({
            title: 'Save',
            icon: 'glyp-complete',
            classes: ['save-dive-action'],
            click: {key: this.saveKey}
        }, 'tertiary')

        this.addAction({
            title: 'Run',
            icon: 'glyp-play',
            click: {key: this.runKey}
        }, 'tertiary')

        this.onClick(this.discardKey, _ => {
            log.info("Discarding dive changes")
            Nav.visit(location.href)
        })

        this.onClick(this.saveKey, _ => this.save())

        this.onClick(this.runKey, _ => this.run())

        this.listenMessage(DiveEditor.diveChangedKey, _ => {
            log.info("Dive changed")
            this.element?.classList.add('changed')
        }, {attach: 'passive'})

        this.dirty()
    }

    get parentClasses(): Array<string> {
        return ['dd-dive-editor-page']
    }

    renderContent(parent: PartTag) {
        parent.part(this.editor)
    }

    async save() {
        const dive = await this.editor.serialize()
        log.info(`Saving dive ${dive.name}`, dive)
        const res = await Db().upsert('dd_dive', dive)
        if (res.status == 'success') {
            this.successToast(`Saved Dive!`)
            this.element?.classList.remove('changed')
        }
        else {
            this.alertToast(res.message)
        }
    }

    async run() {
        const dive = await this.editor.serialize()
        this.app.showModal(DiveRunModal, {dive})
    }
}


////////////////////////////////////////////////////////////////////////////////
// New Query Modal
////////////////////////////////////////////////////////////////////////////////

type NewQueryState = {
    editor: DiveEditor
    schema: SchemaDef
}

class NewQueryModal extends ModalPart<NewQueryState> {

    addKey = messages.untypedKey()
    settingsForm!: QueryForm
    modelPicker!: QueryModelPicker

    async init() {
        this.settingsForm = this.makePart(QueryForm, {query: {id: 'new', name: '', notes: ''}})
        this.modelPicker = this.makePart(QueryModelPicker, {schema: this.state.schema})

        this.setIcon('glyp-data_dive_query')
        this.setTitle("New Query")

        this.addAction({
            title: "Add",
            icon: 'glyp-plus',
            click: {key: this.addKey}
        })

        this.onClick(this.addKey, async _ => {
            await this.save()
        })

        this.onChange(this.modelPicker.pickedKey, m => {
            log.info(`Picked model ${m.data.model}`)
            const model = this.state.schema.models[m.data.model]
            if (!this.settingsForm.state.query.name?.length) {
                this.settingsForm.state.query.name = model.name
                this.settingsForm.dirty()
            }
        })
    }

    renderContent(parent: PartTag): void {
        parent.div('.tt-flex.tt-form.padded.column.gap.dd-new-query-form', col => {
            col.part(this.settingsForm)
            col.part(this.modelPicker)
        })
    }

    async save() {
        log.info(`Saving new query`)
        const settings = await this.settingsForm.fields.serialize()
        if (!settings.name?.length) {
            this.showToast("Please enter a query name", {color: 'alert'})
            this.dirty()
            return
        }
        const model = this.modelPicker.model
        if (!model) {
            this.showToast("Please select a model", {color: 'alert'})
            return
        }
        const query = {...settings, id: Ids.makeUuid(), from: {model: model.name}}
        this.state.editor.addQuery(query)
        this.state.editor.tabs.showTab(query.id)
        this.pop()
    }

}