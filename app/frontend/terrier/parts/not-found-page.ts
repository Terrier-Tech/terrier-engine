import {Logger} from "tuff-core/logging"
import PagePart from "./page-part"
import {NoState, PartTag} from "tuff-core/parts"

const log = new Logger('NotFoundRoute')

/**
 * Default page part if the router can't find the path.
 */
export default class NotFoundRoute extends PagePart<NoState> {
    async init() {
        this.setTitle("Page Not Found")
    }

    renderContent(parent: PartTag) {
        log.warn(`Not found: ${this.context.href}`)
        parent.h1({text: "Not Found"})
    }

}