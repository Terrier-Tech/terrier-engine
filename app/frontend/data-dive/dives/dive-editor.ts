import Schema, { SchemaDef } from "../../terrier/schema"
import { PartTag } from "tuff-core/parts"
import Dives from "./dives"
import Queries, { Query, QueryModelPicker } from "../queries/queries"
import QueryEditor from "../queries/query-editor"
import { Logger } from "tuff-core/logging"
import QueryForm from "../queries/query-form"
import { TabContainerPart } from "../../terrier/tabs"
import ContentPart from "../../terrier/parts/content-part"
import { ModalPart } from "../../terrier/modals"
import { DdDive } from "../gen/models"
import Ids from "../../terrier/ids"
import Db from "../dd-db"
import DdSession from "../dd-session"
import { DiveRunModal } from "./dive-runs"
import Nav from "tuff-core/nav"
import Messages from "tuff-core/messages"
import Arrays from "tuff-core/arrays"
import { FormFields } from "tuff-core/forms"
import Fragments from "../../terrier/fragments"
import { DiveDeliveryPanel } from "./dive-delivery"
import DivePlotList from "../plots/dive-plot-list"
import { DivePage } from "./dive-page"

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

    queryTabs!: TabContainerPart
    settingsTabs!: TabContainerPart

    deliveryPanel!: DiveDeliveryPanel

    plotList!: DivePlotList

    newQueryKey = Messages.untypedKey()
    duplicateQueryKey = Messages.untypedKey()

    static readonly diveChangedKey = Messages.untypedKey()

    queries = new Array<Query>()

    async init() {
        this.queryTabs = this.makePart(TabContainerPart, { side: 'top' })
        this.settingsTabs = this.makePart(TabContainerPart, { side: 'top' })

        this.queryTabs.addBeforeAction({
            title: 'Queries:',
            icon: 'glyp-data_dive_query'
        })
        this.queryTabs.addAfterAction({
            title: "Add Another Query",
            classes: ['dd-hint', 'arrow-right', 'glyp-hint'],
            tooltip: "Each query represents a separate tab in the resulting spreadsheet",
            click: { key: this.newQueryKey }
        })
        this.queryTabs.addAfterAction({
            icon: 'glyp-copy',
            classes: ['duplicate-query'],
            tooltip: "Duplicate this query",
            click: { key: this.duplicateQueryKey }
        })
        this.queryTabs.addAfterAction({
            icon: 'glyp-plus_outline',
            classes: ['new-query'],
            tooltip: "Add a new query to this Dive",
            click: { key: this.newQueryKey }
        })

        this.queries = this.state.dive.query_data?.queries || []
        for (const query of this.queries) {
            this.addQueryTab(query)
        }

        this.listenMessage(QueryForm.settingsChangedKey, m => {
            const query = m.data
            log.info(`Query settings changed`, query)
            this.queryTabs.updateTab({ key: query.id, title: query.name })
        })

        this.onClick(this.newQueryKey, _ => {
            this.app.showModal(NewQueryModal, { editor: this as DiveEditor, schema: this.state.schema })
        })

        this.onClick(this.duplicateQueryKey, _ => {
            const id = this.queryTabs.currentTagKey
            if (id?.length) {
                const query = this.queries.find(q => q.id == id)
                if (query) {
                    this.app.showModal(DuplicateQueryModal, {
                        editor: this as DiveEditor,
                        schema: this.state.schema,
                        query
                    })
                }
                else {
                    this.app.alertToast(`No query with id ${id}`, 'glyp-alert')
                }
            }
            else {
                this.app.alertToast("No query shown", 'glyp-alert')
            }
        })

        this.onClick(DiveEditor.deleteQueryKey, m => {
            this.app.confirm({ title: "Delete Query", icon: 'glyp-delete', body: "Are you sure you want to delete this query?" }, () => {
                this.deleteQuery(m.data.id)
            })
        })

        this.deliveryPanel = this.settingsTabs.upsertTab({
            key: 'delivery',
            title: "Delivery",
            icon: "glyp-email"
        }, DiveDeliveryPanel, this.state)

        this.plotList = this.settingsTabs.upsertTab({
            key: 'plots',
            title: "Plots",
            icon: "glyp-differential"
        }, DivePlotList, this.state)
    }

    /**
     * Add a new query to the dive.
     * @param query
     */
    addQuery(query: Query) {
        this.queries.push(query)
        this.addQueryTab(query)
    }

    /**
     * Adds a tab for an existing query.
     * @param query
     */
    private addQueryTab(query: Query) {
        const state = { ...this.state, query }
        this.queryTabs.upsertTab({ key: query.id, title: query.name }, QueryEditor, state)
    }

    deleteQuery(id: string) {
        log.info(`Deleting query ${id}`)
        if (Arrays.deleteIf(this.queries, q => q.id == id) > 0) {
            this.queryTabs.removeTab(id)
            this.dirty()
        }
    }

    get parentClasses(): Array<string> {
        return ['dd-dive-editor', 'tt-flex']
    }

    renderContent(parent: PartTag) {
        parent.div(".stretch", col => {
            col.part(this.queryTabs)
        })
        parent.div(".shrink", col => {
            col.part(this.settingsTabs)
        })
    }

    static readonly deleteQueryKey = Messages.typedKey<{ id: string }>()

    async serialize(): Promise<DdDive> {
        const queries = this.queries

        return {
            ...this.state.dive,
            query_data: { queries }
        }
    }

}


////////////////////////////////////////////////////////////////////////////////
// Editor Page
////////////////////////////////////////////////////////////////////////////////

export class DiveEditorPage extends DivePage<{ id: string }> {

    editor!: DiveEditor
    session!: DdSession

    showHintsKey = Messages.untypedKey()
    saveKey = Messages.untypedKey()
    discardKey = Messages.untypedKey()
    runKey = Messages.untypedKey()

    async init() {
        log.info(`Loading dive ${this.state.id}`)

        const schema = await Schema.get()
        this.session = await DdSession.get()
        const dive = await Dives.get(this.state.id)
        this.editor = this.makePart(DiveEditor, { schema, dive, session: this.session })

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

        this.addDocsAction()

        this.addToolbarInput('show-hints', 'checkbox', {
            title: "Hints",
            icon: 'glyp-hint',
            defaultValue: this.session.showHints.toString(),
            onChangeKey: this.showHintsKey,
            onInputKey: this.showHintsKey
        })

        this.addAction({
            title: 'Sync to Terrier',
            icon: 'glyp-terrier_sync',
            classes: ['terrier-record-sync'],
            data: { id: this.state.id, table: 'dd_dive', title: dive.name, direction: 'up' }
        }, 'tertiary')

        this.addAction({
            title: 'Discard',
            icon: 'glyp-cancelled',
            classes: ['discard-dive-action'],
            click: { key: this.discardKey }
        }, 'tertiary')

        this.addAction({
            title: 'Save',
            icon: 'glyp-complete',
            classes: ['save-dive-action'],
            click: { key: this.saveKey }
        }, 'tertiary')

        this.addAction({
            title: 'Run',
            icon: 'glyp-play',
            click: { key: this.runKey }
        }, 'tertiary')

        this.onClick(this.discardKey, _ => {
            log.info("Discarding dive changes")
            Nav.visit(location.href)
        })

        this.onClick(this.saveKey, _ => this.save())

        this.onClick(this.runKey, _ => this.run())

        this.onInput(this.showHintsKey, m => {
            // TODO: fix emitInput and emitChange to return the correct value in tuff
            const showHints = (m.event.target as HTMLInputElement).checked
            log.info(`Show hints input to ${showHints}`, m)
            this.session.showHints = showHints
        })

        this.listenMessage(DiveEditor.diveChangedKey, _ => {
            log.info("Dive changed")
            this.element?.classList.add('changed')
        }, { attach: 'passive' })

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
        this.app.showModal(DiveRunModal, { dive })
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

    addKey = Messages.untypedKey()
    settingsForm!: QueryForm
    modelPicker!: QueryModelPicker

    async init() {
        this.settingsForm = this.makePart(QueryForm, { query: { id: 'new', name: '', notes: '' } })
        this.modelPicker = this.makePart(QueryModelPicker, { schema: this.state.schema })

        this.setIcon('glyp-data_dive_query')
        this.setTitle("New Query")

        this.addAction({
            title: "Add",
            icon: 'glyp-plus',
            click: { key: this.addKey }
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
            this.showToast("Please enter a query name", { color: 'alert' })
            this.dirty()
            return
        }
        const model = this.modelPicker.model
        if (!model) {
            this.showToast("Please select a model", { color: 'alert' })
            return
        }
        const query = { ...settings, id: Ids.makeUuid(), from: { model: model.name } }
        this.state.editor.addQuery(query)
        this.state.editor.queryTabs.showTab(query.id)
        this.pop()
    }

}


////////////////////////////////////////////////////////////////////////////////
// Duplicate Query Modal
////////////////////////////////////////////////////////////////////////////////

type DuplicateQueryState = {
    editor: DiveEditor
    schema: SchemaDef
    query: Query
}

class DuplicateQueryModal extends ModalPart<DuplicateQueryState> {

    dupKey = Messages.untypedKey()
    fields!: FormFields<Query>

    async init() {
        this.setIcon('glyp-data_dive_query')
        this.setTitle("Duplicate Query")

        const newQuery = { ...this.state.query, name: `${this.state.query.name} Copy` }
        this.fields = new FormFields<Query>(this, newQuery)

        this.addAction({
            title: "Duplicate",
            icon: 'glyp-checkmark',
            click: { key: this.dupKey }
        })

        this.onClick(this.dupKey, async _ => {
            await this.save()
        })
    }

    async save() {
        const newName = this.fields.data.name
        const query = { ...Queries.duplicate(this.state.query), name: newName }
        this.state.editor.addQuery(query)
        this.state.editor.queryTabs.showTab(query.id)
        this.pop()
        this.app.successToast("Duplicated Query", 'glyp-copy')
        this.emitMessage(DiveEditor.diveChangedKey, {})
    }

    renderContent(parent: PartTag): void {
        parent.div(".tt-flex.column.padded.gap", col => {
            Fragments.simpleHeading(col, this.theme, "Name")
            this.fields.textInput(col, 'name')
        })
    }
}

