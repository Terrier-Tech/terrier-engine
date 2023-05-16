import {PartTag} from "tuff-core/parts"
import {DdThemeType} from "./dd-theme"
import {TerrierApp} from "../terrier/app"
import {NotFoundRoute} from "../terrier/parts"
import {RouterPart} from "tuff-core/routing"
import routes from './routes'


class ContentRouterPart extends RouterPart {
    get defaultPart() {
        return NotFoundRoute
    }

    get routes() {
        return routes
    }

}


export class App extends TerrierApp<DdThemeType> {

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