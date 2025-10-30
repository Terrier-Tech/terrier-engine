import {PartTag} from "tuff-core/parts"
import {DemoPage} from "./demo-app"
import {ListItem, ListViewerDetailsContext, ListViewerPart} from "@terrier/list-viewer"
import Arrays from "tuff-core/arrays"
import {Logger} from "tuff-core/logging"
import TerrierPart from "@terrier/parts/terrier-part"
import Time from "tuff-core/time"
import dayjs from "dayjs"
import Fragments from "@terrier/fragments"

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
            title: `Header ${i/10 + 1}`,
            listClear: true
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
        Fragments.panel(this.theme)
            .title(this.state.title)
            .content(panel => {
                panel.class('padded')
                panel.div('.details').text(this.state.details + ` at ${dayjs().format('h:mm:ss A')}`)
            })
            .addAction({title: "Primary Action", icon: "glyp-checkmark"})
            .customActions(parent => {
                parent.div().text("Custom Action")
            })
            .render(parent)
        log.info(`DemoDetailPart ${this.state.listId} render`, this.element)
    }

}


class DemoListHeader extends TerrierPart<{ time: string }> {

        render(parent: PartTag) {
            parent.div(".list-view-demo-header").text(`Demo Header ${this.state.time}`)
        }
}

class DemoListViewer extends ListViewerPart<DemoItem> {

    async init() {
        await super.init()

        const time = dayjs().format('h:mm:ss A')
        const headerState = {time}
        this.listHeaderPart = this.makePart(DemoListHeader, headerState)

        // make the list reload periodically
        setInterval(
            () => {
                headerState.time = dayjs().format('h:mm:ss A')
                this.listHeaderPart?.dirty()
                log.info(`Reloading at ${headerState.time}`)
                this.reload()
            },
            10000
        )
    }

    async fetchItems(): Promise<DemoItem[]> {
        return Promise.resolve(demoItems);
    }

    renderListItem(parent: PartTag, item: DemoItem) {
        parent.div().text(item.title)
    }

    renderDetails(context: ListViewerDetailsContext<DemoItem>) {
        if ('details' in context.item) {
            context.makePart(DemoDetailPart, context.item)
        }
        else {
            alert("Clicked on a header")
        }
    }

    renderEmptyDetails(parent: PartTag) {
        parent.div().text("Demo Empty Item")
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
            log.info(`Details shown for item ${m.data.id} at ${dayjs().format('h:mm:ss A')}`)
        })
    }

    renderContent(parent: PartTag): void {
        parent.part(this.listDetail)
    }

}
