import {DdContentPart, DdModalPart, DdPagePart, DdTabContainerPart} from "../dd-parts"
import Schema, {ModelDef, SchemaDef} from "../../terrier/schema"
import {PartTag} from "tuff-core/parts"
import Dives, {Dive} from "./dives"
import {Query} from "../queries/queries"
import QueryEditor from "../queries/query-editor"
import {Logger} from "tuff-core/logging"
import QueryForm from "../queries/query-form"
import {messages} from "tuff-core"

const log = new Logger("DiveEditor")


////////////////////////////////////////////////////////////////////////////////
// Editor
////////////////////////////////////////////////////////////////////////////////

export type DiveEditorState = {
    schema: SchemaDef
    dive: Dive
}

export default class DiveEditor extends DdContentPart<DiveEditorState> {

    tabs!: DdTabContainerPart
    newQueryKey = messages.untypedKey()

    async init() {
        this.tabs = this.makePart(DdTabContainerPart, {side: 'top'})

        this.tabs.setBeforeAction({
            title: 'Queries:',
            icon: 'glyp-query'
        })
        this.tabs.setAfterAction({
            icon: 'glyp-plus_outline',
            click: {key: this.newQueryKey}
        })

        for (const query of this.state.dive.queries) {
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
            this.deleteQuery(m.data.id)
        })
    }

    addQuery(query: Query) {
        const state = {...this.state, query}
        this.tabs.upsertTab({key: query.id, title: query.name}, QueryEditor, state)
    }

    deleteQuery(id: string) {
        log.info(`Deleting query ${id}`)
        if (Dives.deleteQuery(this.state.dive, id)) {
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

}


export class DiveEditorPage extends DdPagePart<{}> {

    editor?: DiveEditor

    get parentClasses(): Array<string> {
        return ['dd-dive-editor-page']
    }

    renderContent(parent: PartTag) {
        if (this.editor) {
            parent.part(this.editor)
        }
    }


    load() {
        super.load()

        if (!this.editor) {
            const id = this.context.queryParams.get('id')
            if (id?.length) {
                this.loadDive(id).then()
            }
        }
    }

    async loadDive(id: string) {
        log.info(`Loading dive ${id}`)
        const schema = await Schema.get()
        const dive = await Dives.get(id)
        this.editor = this.makePart(DiveEditor, {schema, dive})

        this.addBreadcrumb({
            title: "Dives"
        })
        this.addBreadcrumb({
            title: dive.name,
            icon: 'glyp-data_dive'
        })

        this.addAction({
            title: 'Save',
            icon: 'glyp-checkmark'
        }, 'tertiary')

        this.dirty()
    }
    
}


////////////////////////////////////////////////////////////////////////////////
// New Query Modal
////////////////////////////////////////////////////////////////////////////////

type NewQueryState = {
    editor: DiveEditor
    schema: SchemaDef
}

class NewQueryModal extends DdModalPart<NewQueryState> {

    addKey = messages.untypedKey()
    settingsForm!: QueryForm
    model?: ModelDef
    modelPickedKey = messages.typedKey<{model: string}>()

    async init() {
        this.settingsForm = this.makePart(QueryForm, {query: {id: 'new', name: '', notes: ''}})

        this.setIcon('glyp-query')
        this.setTitle("New Query")

        this.addAction({
            title: "Add",
            icon: 'glyp-plus',
            click: {key: this.addKey}
        })

        this.onClick(this.addKey, async _ => {
            await this.save()
        })

        this.onChange(this.modelPickedKey, m => {
            log.info(`Picked model ${m.data.model}`)
            this.model = this.state.schema.models[m.data.model]
            if (!this.settingsForm.state.query.name?.length) {
                this.settingsForm.state.query.name = this.model?.name
                this.settingsForm.dirty()
            }
        })
    }

    renderModelOption(parent: PartTag, model: ModelDef) {
        parent.label('.model-option', label => {
            label.input({type: 'radio', name: `new-query-model-${this.id}`, value: model.name})
                .emitChange(this.modelPickedKey, {model: model.name})
            label.div(col => {
                col.div('.name').text(model.name)
                if (model.metadata?.description) {
                    col.div('.description').text(model.metadata.description)
                }
            })
        })
    }

    renderContent(parent: PartTag): void {
        parent.div('.tt-flex.tt-form.padded.column.gap.dd-new-query-form', col => {
            col.part(this.settingsForm)

            const commonModels = Schema.commonModels(this.state.schema)
            if (commonModels.length) {
                col.h3(h3 => {
                    h3.i('.glyp-refresh')
                    h3.span().text("Common Models")
                })
                for (const model of commonModels) {
                    this.renderModelOption(col, model)
                }
            }

            const uncommonModels = Schema.uncommonModels(this.state.schema)
            if (uncommonModels.length) {
                col.h3(h3 => {
                    h3.i('.glyp-pending')
                    h3.span().text("Other Models")
                })
                for (const model of uncommonModels) {
                    this.renderModelOption(col, model)
                }
            }
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
        if (!this.model) {
            this.showToast("Please select a model", {color: 'alert'})
            return
        }
        const query = {...settings, from: {model: this.model.name}}
        this.state.editor.addQuery(query)
        this.pop()
    }

}