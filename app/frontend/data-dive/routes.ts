import {partRoute} from "tuff-core/routing"
import {QueryEditorPage} from "./queries/query-editor"
import {stringParser} from 'typesafe-routes'

const routes = {
    query_editor: partRoute(QueryEditorPage, '/data_dive/query_editor', {query_id: stringParser})
}

export default routes