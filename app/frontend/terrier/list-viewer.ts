import TerrierPart from "./parts/terrier-part"
import {NoState, Part, PartConstructor, PartTag, StatelessPart} from "tuff-core/parts"
import Messages from "tuff-core/messages"
import {Logger} from "tuff-core/logging"

const log = new Logger('List Viewer')

const detailsSelector = '.tt-list-viewer-details-container'

export type ListItemRenderOptions = {
    style?: 'panel' | 'header'
    clickable?: boolean
}

export class ListViewerDetailsContext<T extends {id: string}> {

    part?: StatelessPart

    constructor(readonly viewer: ListViewerPart<T>, readonly item: T) {
    }

    makePart<PartType extends Part<StateType>, StateType>(partType: PartConstructor<PartType, StateType>, state: StateType) {
        this.part = this.viewer.detailsContainer.makePart(partType, state)
        this.viewer.detailsContainer.replacePart(this.part)
    }
}

class DetailsContainerPart extends Part<NoState> {

    part?: StatelessPart

    replacePart(newPart: StatelessPart) {
        if (this.part) {
            this.removeChild(this.part)
        }
        this.part = newPart
    }

    get parentClasses(): Array<string> {
        return ['tt-list-viewer-details']
    }

    render(parent: PartTag) {
        if (this.part) {
            parent.part(this.part)
        }
    }

}


/**
 * Part for viewing a list of items and the details associated with them.
 * Each item must have an `id` so that they can be distinguished.
 */
export abstract class ListViewerPart<T extends {id: string}> extends TerrierPart<any> {

    detailsContainer!: DetailsContainerPart

    items: T[] = []
    itemMap: Record<string, T> = {}

    itemClickedKey = Messages.typedKey<{id: string}>()

    /**
     * A message with this key gets emitted whenever the details are shown.
     */
    detailsShownKey = Messages.typedKey<{ id: string }>()

    async init() {
        await super.init()

        this.detailsContainer = this.makePart(DetailsContainerPart, {})

        await this.reload()

        this.onClick(this.itemClickedKey, m => {
            log.info(`Clicked on list item ${m.data.id}`, m)
            this.showDetails(m.data.id)
        })
    }


    /// Fetching

    abstract fetchItems(): Promise<T[]>

    async reload() {
        this.items = await this.fetchItems()
        this.items.forEach((item) => {
            this.itemMap[item.id] = item
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
                list.div('.tt-list-viewer-item', {id: `item-${item.id}`}, itemView => {
                    const opts = this.renderListItem(itemView, item)
                    const style = opts?.style || 'panel'
                    itemView.class(style)
                    if (opts?.clickable) {
                        itemView.class('clickable')
                        itemView.emitClick(this.itemClickedKey, {id: item.id})
                    }
                })
            }
        })
        parent.div(detailsSelector).part(this.detailsContainer)
    }
    abstract renderListItem(parent: PartTag, item: T): ListItemRenderOptions | void

    abstract renderItemDetail(parent: PartTag, item: T): any

    abstract renderDetails(context: ListViewerDetailsContext<T>): any


    // Details

    private setCurrent(id: string) {
        // clear any existing current item
        const existingCurrents = this.element!.querySelectorAll('.tt-list-viewer-list .current')
        existingCurrents.forEach((elem) => {
            elem.classList.remove('current')
        })

        // add .current to the new item
        const itemView = this.element!.querySelector(`#item-${id}`)
        if (itemView) {
            itemView.classList.add('current')
        }
    }

    /**
     * Show the details view for the item with the given id
     * @param id
     */
    showDetails(id: string) {
        this.setCurrent(id)
        const item = this.itemMap[id]
        if (!item) {
            throw `No item ${id}`
        }

        const context = new ListViewerDetailsContext(this, item)
        this.renderDetails(context)

        if (context.part) {
        }

        this.arrangeDetails(id)

        // let the world know
        this.emitMessage(this.detailsShownKey, {id})

        // const container = this.element!.querySelector(detailsSelector)
        // if (container) {
        //
        //     // // render the details
        //     // const detailsView = Html.createElement('div', div => {
        //     //     this.renderItemDetail(div, item)
        //     // })
        //     // container.innerHTML = detailsView.innerHTML
        //     this.arrangeDetails(id, container as HTMLElement)
        //
        //     // let the world know
        //     this.emitMessage(this.detailsShownKey, {id})
        // }
        // else {
        //     log.warn(`Tried to show item ${id} but there was no ${detailsSelector}`)
        // }
    }

    /**
     * If necessary, move the details next to the item
     * @param id the item id
     */
    arrangeDetails(id: string) {
        const detailsView = this.element!.querySelector(detailsSelector)!
        const itemView = this.element!.querySelector(`#item-${id}`)
        if (itemView) {
            // const listView = itemIVew.parentElement
            log.info(`Item is ${itemView.clientWidth} wide and the window is ${window.innerWidth} wide`)
            // crude but effective way to determine if the list is collapsed due to the media breakpoint
            if (itemView.clientWidth > window.innerWidth * 0.8) {
                // move the details to right after the list item
                itemView.after(detailsView)
            }
            else {
                // move the details back to the container
                const detailsContainer = this.element!.querySelector(`.tt-list-viewer-details-container`)
                if (detailsContainer) {
                    detailsContainer.append(detailsView)
                }
            }
        }
        else {
            log.warn(`No item view for ${id}`)
        }
    }

}