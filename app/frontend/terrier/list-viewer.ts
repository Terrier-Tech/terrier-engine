import TerrierPart from "./parts/terrier-part"
import {PartTag} from "tuff-core/parts"
import Messages from "tuff-core/messages"
import {Logger} from "tuff-core/logging"
import Ids from "./ids"
import Html from "tuff-core/html"

const log = new Logger('List Viewer')

/**
 * Wraps the actual item data in order to store additional information about it.
 */
type ListItem<T extends {}> = {
    data: T
    id: string
}

const detailsSelector = '.tt-list-viewer-details-container'

export abstract class ListViewerPart<T extends {}> extends TerrierPart<any> {

    items: ListItem<T>[] = []
    itemMap: Record<string, ListItem<T>> = {}

    itemClickedKey = Messages.typedKey<{id: string}>()

    async init() {
        await super.init()

        await this.reload()

        this.onClick(this.itemClickedKey, m => {
            log.info(`Clicked on list item ${m.data.id}`, m)
            this.showDetails(m.data.id)
        })
    }


    /// Fetching

    abstract fetchItems(): Promise<T[]>

    async reload() {
        const itemData = await this.fetchItems()
        this.items = itemData.map((data) => {
            const id = Ids.makeUuid()
            const item = {id, data}
            this.itemMap[id] = item
            return item
        })

        this.dirty()
    }


    /// Rendering

    get parentClasses(): Array<string> {
        return ['tt-list-viewer']
    }

    render(parent: PartTag): any {
        parent.div('.tt-list-viewer-list', list => {
            for (const item of this.items) {
                list.a('.tt-list-viewer-item', itemView => {
                    this.renderListItem(itemView, item.data)
                }).emitClick(this.itemClickedKey, {id: item.id})
            }
        })
        parent.div(detailsSelector)
    }
    abstract renderListItem(parent: PartTag, item: T): any

    abstract renderItemDetail(parent: PartTag, item: T): any


    // Details

    showDetails(id: string) {
        const item = this.itemMap[id]
        if (!item) {
            throw `No item ${id}`
        }
        const container = this.element!.querySelector(detailsSelector)
        if (container) {
            const detailsView = Html.createElement('div', div => {
                div.class('tt-list-viewer-details')
                this.renderItemDetail(div, item.data)
            })
            container.innerHTML = detailsView.outerHTML
        }
        else {
            log.warn(`Tried to show item ${id} but there was no ${detailsSelector}`)
        }
    }

}