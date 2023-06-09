import {DdContentPart, DdPagePart, DdTabContainerPart} from "../dd-parts"
import Schema, {SchemaDef} from "../../terrier/schema"
import {PartTag} from "tuff-core/parts"
import Dives, {Dive} from "./dives"
import {Query} from "../queries/queries"
import QueryEditor from "../queries/query-editor"
import {Logger} from "tuff-core/logging"

const log = new Logger("DiveEditor")


export type DiveEditorState = {
    schema: SchemaDef
    dive: Dive
}

class DiveEditor extends DdContentPart<DiveEditorState> {

    tabs!: DdTabContainerPart

    async init() {
        this.tabs = this.makePart(DdTabContainerPart, {side: 'top'})

        for (const query of this.state.dive.queries) {
            this.addQuery(query)
        }
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
        this.dirty()
    }
    
}