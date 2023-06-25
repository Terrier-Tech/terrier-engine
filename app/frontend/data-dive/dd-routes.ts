import {partRoute} from "tuff-core/routing"
import {stringParser} from 'typesafe-routes'
import {DiveListPage} from "./dives/dive-list"
import {DiveEditorPage} from "./dives/dive-editor"


export const routes = {
    list: partRoute(DiveListPage, '/data_dive/list', {}),
    editor: partRoute(DiveEditorPage, '/data_dive/editor', {id: stringParser})
}