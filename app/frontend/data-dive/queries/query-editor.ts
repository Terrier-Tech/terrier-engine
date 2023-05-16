import {DdContentPart, DdPagePart} from "../dd-parts"
import {PartTag} from "tuff-core/parts"
import Schema, {SchemaDef} from "../../terrier/schema"
import {Query} from "./query"
import Api from "../../terrier/api"
import {FromTableEditor} from "./tables"


const testIds = ['joins', 'grouping']

async function getQuery(id: string): Promise<Query> {
    if (testIds.includes(id)) {
        const res = await Api.safeGet<{query: Query}>(`/data_dive/test_query/${id}.json`, {})
        return res.query
    }
    else {
        throw `Don't know how to actually get queries`
    }
}

export type QueryEditorState = {
    schema: SchemaDef
    query: Query
}

class QueryEditor extends DdContentPart<QueryEditorState> {

    tableEditor!: FromTableEditor

    async init() {
        this.tableEditor = this.makePart(FromTableEditor, {schema: this.state.schema, table: this.state.query.from})
    }

    renderContent(parent: PartTag): void {
        parent.part(this.tableEditor)
    }

}

export class QueryEditorPage extends DdPagePart<{query_id: string}> {

    editor!: QueryEditor

    async init() {
        const schema = await Schema.get()
        const query = await getQuery(this.state.query_id)
        this.editor = this.makePart(QueryEditor, {schema, query})
        this.dirty()
    }

    renderContent(parent: PartTag): void {
        parent.div('.dd-query-editor-canvas', canvas => {
            canvas.part(this.editor)
        })
    }

}