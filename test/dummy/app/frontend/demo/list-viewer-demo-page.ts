import {PartTag} from "tuff-core/parts"
import {DemoPage} from "./demo-app"
import {ListViewerPart} from "@terrier/list-viewer"
import Arrays from "tuff-core/arrays"
import Ids from "@terrier/ids"
import {Logger} from "tuff-core/logging"

const log = new Logger('List Viewer Demo')

type DemoPanelItem = {
    type: 'panel'
    id: string
    title: string
    details: string
}

type DemoHeaderItem = {
    type: 'header'
    id: string
    title: string
}

type DemoItem = DemoPanelItem | DemoHeaderItem

const demoItems: DemoItem[] = Arrays.range(0, 50).map((i) => {
    if (i % 10 == 0) {
        return {
            type: 'header',
            id: Ids.makeUuid(),
            title: `Header ${i/10 + 1}`
        }
    }
    return {
        type: 'panel',
        id: Ids.makeUuid(),
        title: `Item ${i}`,
        details: `Panel Item ${i} details...`
    }
})

class DemoListDetailPart extends ListViewerPart<DemoItem> {
    async fetchItems(): Promise<DemoItem[]> {
        return Promise.resolve(demoItems);
    }

    renderItemDetail(parent: PartTag, item: DemoItem) {
        if (item.type == 'panel') {
            parent.div().text(item.details)
        }
    }

    renderListItem(parent: PartTag, item: DemoItem) {
        parent.div().text(item.title)
        return {
            style: item.type,
            clickable: item.type == 'panel'
        }
    }

}


export default class ListViewerDemoPage extends DemoPage {

    listDetail!: DemoListDetailPart

    async init() {
        await super.init()

        this.setIcon('glyp-items')
        this.setTitle("List Viewer Demo")

        this.listDetail = this.makePart(DemoListDetailPart, {})

        this.listenMessage(this.listDetail.detailsShownKey, m => {
            log.info(`Details shown for item ${m.data.id}`)
        })
    }

    renderContent(parent: PartTag): void {
        parent.part(this.listDetail)
    }

}
