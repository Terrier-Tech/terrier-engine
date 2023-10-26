import {NoState, PartTag} from "tuff-core/parts"
import PagePart from "@terrier/parts/page-part"


export default class ListDetailPage extends PagePart<NoState> {

    async init() {
        await super.init()

        this.setIcon('glyp-items')
        this.setTitle("List/Detail Demo")

        this.addBreadcrumb({
            title: "Terrier Engine",
            icon: 'glyp-terrier',
            href: "/"
        })
    }

    renderContent(parent: PartTag): void {
        parent.h1().text("List/Detail")
    }

}
