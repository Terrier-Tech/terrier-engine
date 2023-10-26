import {PartTag} from "tuff-core/parts"
import {DemoPage} from "./demo-app"
import {ListViewerPart} from "@terrier/list-viewer"
import Arrays from "tuff-core/arrays"
import Ids from "@terrier/ids"

type DemoItem = {
    id: string
    title: string
    details: string
}

const demoItems: DemoItem[] = Arrays.range(0, 50).map((i) => {
    return {
        id: Ids.makeUuid(),
        title: `Item ${i}`,
        details: `Item ${i} details...`
    }
})

class DemoListDetailPart extends ListViewerPart<DemoItem> {
    async fetchItems(): Promise<DemoItem[]> {
        return Promise.resolve(demoItems);
    }

    renderItemDetail(parent: PartTag, item: DemoItem) {
        parent.div().text(item.details)
    }

    renderListItem(parent: PartTag, item: DemoItem) {
        parent.div().text(item.title)
    }

}


export default class ListViewerDemoPage extends DemoPage {

    listDetail!: DemoListDetailPart

    async init() {
        await super.init()

        this.setIcon('glyp-items')
        this.setTitle("List Viewer Demo")

        this.listDetail = this.makePart(DemoListDetailPart, {})
    }

    renderContent(parent: PartTag): void {
        parent.part(this.listDetail)
    }

}
