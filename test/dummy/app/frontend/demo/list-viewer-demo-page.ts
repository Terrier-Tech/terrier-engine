import {PartTag} from "tuff-core/parts"
import {DemoPage} from "./demo-app"
import {ListItem, ListViewerDetailsContext, ListViewerPart} from "@terrier/list-viewer"
import Arrays from "tuff-core/arrays"
import {Logger} from "tuff-core/logging"
import TerrierPart from "@terrier/parts/terrier-part"
import Time from "tuff-core/time"

const log = new Logger('List Viewer Demo')

type DemoPanelItem = ListItem & {
    title: string
    details: string
}

type DemoHeaderItem = ListItem & {
    title: string
}

type DemoItem = DemoPanelItem | DemoHeaderItem

const demoItems: DemoItem[] = Arrays.range(0, 50).map((i) => {
    if (i % 10 == 0) {
        return {
            listId: `demo-${i}`,
            listStyle: 'header',
            title: `Header ${i/10 + 1}`
        }
    }
    return {
        listId: `demo-${i}`,
        listStyle: 'panel',
        listClickable: true,
        title: `Item ${i}`,
        details: `Panel Item ${i} details...`
    }
})

class DemoDetailPart extends TerrierPart<DemoPanelItem> {

    async init() {
        await Time.wait(100)
        log.info(`DemoDetailPart ${this.state.listId} init`)
        this.dirty()
    }

    render(parent: PartTag) {
        parent.h2().text(this.state.title)
        parent.div('.details').text(this.state.details)
        log.info(`DemoDetailPart ${this.state.listId} render`, this.element)
    }

}


class DemoListViewer extends ListViewerPart<DemoItem> {
    async fetchItems(): Promise<DemoItem[]> {
        return Promise.resolve(demoItems);
    }

    renderListItem(parent: PartTag, item: DemoItem) {
        parent.div().text(item.title)
    }

    renderDetails(context: ListViewerDetailsContext<DemoItem>) {
        context.makePart(DemoDetailPart, context.item as DemoPanelItem)
    }

}


export default class ListViewerDemoPage extends DemoPage {

    listDetail!: DemoListViewer

    async init() {
        await super.init()

        this.setIcon('glyp-items')
        this.setTitle("List Viewer Demo")

        this.listDetail = this.makePart(DemoListViewer, {})

        this.listenMessage(this.listDetail.detailsShownKey, m => {
            log.info(`Details shown for item ${m.data.id}`)
        })
    }

    renderContent(parent: PartTag): void {
        parent.part(this.listDetail)
    }

}
