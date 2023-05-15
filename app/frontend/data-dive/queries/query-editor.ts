import {DdContentPart, DdPagePart} from "../dd-parts"
import {PartTag} from "tuff-core/parts"
import Schema, {SchemaDef} from "../schema"
import {Query} from "../query"
import Api from "../../terrier/api"

export type SchemaState = {
}

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
    renderContent(parent: PartTag): void {
        parent.p({text: `Edit query ${this.state.query.id}`})
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
        parent.part(this.editor)
    }

}