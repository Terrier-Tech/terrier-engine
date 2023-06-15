import {DdContentPart, DdPagePart, DdTabContainerPart} from "../dd-parts"
import Schema, {SchemaDef} from "../../terrier/schema"
import {PartTag} from "tuff-core/parts"
import Dives, {Dive} from "./dives"
import {Query} from "../queries/queries"
import QueryEditor from "../queries/query-editor"
import {Logger} from "tuff-core/logging"
import QueryForm from "../queries/query-form"

const log = new Logger("DiveEditor")


export type DiveEditorState = {
    schema: SchemaDef
    dive: Dive
}

class DiveEditor extends DdContentPart<DiveEditorState> {

    tabs!: DdTabContainerPart

    async init() {
        this.tabs = this.makePart(DdTabContainerPart, {side: 'top'})

        this.tabs.setBeforeAction({
            title: 'Queries:',
            icon: 'glyp-query'
        })
        this.tabs.setAfterAction({
            icon: 'glyp-plus_outline'
        })

        for (const query of this.state.dive.queries) {
            this.addQuery(query)
        }

        this.listenMessage(QueryForm.settingsChangedKey, m => {
            const query = m.data
            log.info(`Query settings changed`, query)
            this.tabs.updateTab({key: query.id, title: query.name})
        })
    }

    addQuery(query: Query) {
        const state = {...this.state, query}
        this.tabs.upsertTab({key: query.id, title: query.name}, QueryEditor, state)
    }

    get parentClasses(): Array<string> {
        return ['dd-dive-editor']
    }

    renderContent(parent: PartTag) {
        parent.part(this.tabs)
    }

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