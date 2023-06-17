import {Logger} from "tuff-core/logging"
import Theme, {ThemeType} from "../theme"
import {TerrierApp} from "../app"
import PagePart from "./page-part"
import {NoState, PartTag} from "tuff-core/parts"

const log = new Logger('NotFoundRoute')

/**
 * Default page part if the router can't find the path.
 */
export default class NotFoundRoute<
    TAppState extends { theme: TTheme },
    TT extends ThemeType,
    TApp extends TerrierApp<TAppState, TT, TApp, TTheme>,
    TTheme extends Theme<TT>
> extends PagePart<NoState, TAppState, TT, TApp, TTheme> {
    async init() {
        this.setTitle("Page Not Found")
    }

    renderContent(parent: PartTag) {
        log.warn(`Not found: ${this.context.href}`)
        parent.h1({text: "Not Found"})
    }

}