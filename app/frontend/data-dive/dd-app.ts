import {NoState, PartTag} from "tuff-core/parts"
import {TerrierApp} from "../terrier/app"
import {RouterPart} from "tuff-core/routing"
import {routes} from "./dd-routes"
import {DiveListPage} from "./dives/dive-list"
import DdSession from "./dd-session"

class ContentRouterPart extends RouterPart {
    get defaultPart() {
        return DiveListPage
    }

    get routes() {
        return routes
    }

}

export default class DdApp extends TerrierApp<NoState> {

    contentPart!: ContentRouterPart
    session!: DdSession

    async init() {
        await super.init()
        this.contentPart = this.makePart(ContentRouterPart, {})

        this.session = await DdSession.get()

        this.dirty()
    }

    get parentClasses(): Array<string> {
        return ['tt-typography']
    }

    render(parent: PartTag) {
        parent.part(this.contentPart)
        parent.part(this.overlayPart)
    }

}
