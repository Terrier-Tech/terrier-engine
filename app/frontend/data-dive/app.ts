import {PartTag} from "tuff-core/parts"
import DdTheme, {DdThemeType} from "./dd-theme"
import {TerrierApp} from "../terrier/app"
import {RouterPart} from "tuff-core/routing"
import routes from './routes'
import NotFoundRoute from "../terrier/parts/not-found-page"


class ContentRouterPart extends RouterPart {
    get defaultPart() {
        return NotFoundRoute
    }

    get routes() {
        return routes
    }

}


export class DdApp extends TerrierApp<DdThemeType, DdApp, DdTheme> {

    router!: ContentRouterPart

    async init() {
        await super.init()
        this.router = this.makePart(ContentRouterPart, {})
        this.dirty()
    }

    get parentClasses(): Array<string> {
        return ['tt-typography']
    }

    render(parent: PartTag) {
        parent.part(this.router)
        parent.part(this.overlayPart)
    }

}