import TerrierPart from "./parts/terrier-part"
import {Part, PartConstructor, PartTag, StatelessPart} from "tuff-core/parts"
import Messages from "tuff-core/messages"
import {Logger} from "tuff-core/logging"
import {PageBreakpoints} from "./parts/page-part"
import { parseQueryParams } from "tuff-core/urls"

const log = new Logger('List Viewer')

/**
 * All list items should have an `listId` value so that we can distinguish them.
 * The rest are optional fields to control how the items are rendered and interacted with.
 */
export type ListItem = {
    listId: string
    listClickable?: boolean
    listClear?: boolean
    listStyle?: 'none' | 'panel' | 'header'
}

/**
 * One of these gets created for each item in the list.
 */
class ListItemPart<T extends ListItem> extends Part<T> {

    viewer!: ListViewerPart<T>

    render(parent: PartTag) {
        const isCurrent = this.viewer.detailsContext?.id == this.state.listId

        parent.div('.tt-list-viewer-item', itemView => {
            this.viewer.renderListItem(itemView, this.state)
            const style = this.state.listStyle || 'none'
            itemView.class(style)
            if (this.state.listClickable) {
                itemView.class('clickable')
                itemView.emitClick(this.viewer.itemClickedKey, {listId: this.state.listId})
            }
            else if (this.state.listClear) {
                itemView.emitClick(this.viewer.clearCurrentKey)
            }
            if (isCurrent) {
                itemView.class('current')
            }
        }).id(`item-${this.state.listId}`)

        // render the details if this is the current item and it's supposed to be rendered inline
        if (isCurrent && this.viewer.layout == 'inline') {
            log.debug(`ListItemPart: rendering inline item details`)
            if (this.viewer.currentDetailsPart) {
                parent.part(this.viewer.currentDetailsPart)
            }
        }
    }

}

/**
 * Allows ListViewerPart subclasses to either directly render content for
 * the list details or make a part to do it.
 */
export class ListViewerDetailsContext<T extends ListItem> {

    /**
     * The item id for which this context is representing the details.
     */
    get id(): string {
        return this.item.listId
    }

    /**
     * The part created by `makePart()` to render the details.
     */
    part?: StatelessPart

    /**
     * The part representing this item in the list.
     */
    itemPart?: ListItemPart<T>

    constructor(readonly viewer: ListViewerPart<T>, readonly item: T) {
    }

    /**
     * Make a part to render the details for the list item.
     * @param partType
     * @param state
     */
    makePart<PartType extends Part<StateType>, StateType>(partType: PartConstructor<PartType, StateType>, state: StateType) {
        if (this.viewer.layout == 'side') {
            this.part = this.viewer.sideContainerPart.makePart(partType, state)
        }
        else {
            this.part = this.viewer.currentItemPart?.makePart(partType, state)
        }
    }

    /**
     * Ensure that the rendered part is disposed and the related item part is marked dirty.
     */
    clear() {
        if (this.part) {
            this.viewer.removeChild(this.part)
            this.part = undefined
        }
        if (this.itemPart) {
            this.itemPart.dirty()
        }
    }
}

/**
 * This part sits permanently on the side and will render the details if
 * the viewer's detailsLocation = 'side'.
 */
class SideContainerPart extends Part<{viewer: ListViewerPart<any>}> {

    viewer!: ListViewerPart<any>

    async init() {
        this.viewer = this.state.viewer
    }

    get parentClasses(): Array<string> {
        return ['tt-list-viewer-side-details']
    }

    render(parent: PartTag) {
        if (this.viewer.currentDetailsPart) {
            log.debug(`[SideContainerPart] Rendering details part`, this.viewer.currentDetailsPart)
            parent.part(this.viewer.currentDetailsPart)
        }
        else {
            log.debug(`[SideContainerPart] No details part to render`)
            this.viewer.renderEmptyDetails(parent)
        }
    }

}


/**
 * Part for viewing a list of items and the details associated with them.
 * Each item must have an `id` so that they can be distinguished.
 */
export abstract class ListViewerPart<T extends ListItem> extends TerrierPart<any> {

    sideContainerPart!: SideContainerPart

    detailsContext?: ListViewerDetailsContext<T>
    layout: 'inline' | 'side' = 'side'

    get currentDetailsPart(): StatelessPart | undefined  {
        return this.detailsContext?.part
    }

    get currentItemPart(): StatelessPart | undefined  {
        return this.detailsContext?.itemPart
    }

    items: T[] = []
    itemPartMap: Record<string, ListItemPart<T>> = {}

    /**
     * Emit this key when a specific item is clicked.
     */
    itemClickedKey = Messages.typedKey<ListItem>()

    /**
     * Emit this key to clear the current selection.
     */
    clearCurrentKey = Messages.untypedKey()

    /**
     * Clears the currently selected item.
     */
    clearCurrent() {
        this.detailsContext?.clear()
        this.detailsContext = undefined
        this.dirty()
    }

    /**
     * A message with this key gets emitted whenever the details are shown.
     */
    detailsShownKey = Messages.typedKey<{ id: string }>()

    async init() {
        await super.init()

        this.sideContainerPart = this.makePart(SideContainerPart, {viewer: this})

        await this.reload()
        this.dirty()

        this.onClick(this.itemClickedKey, m => {
            log.debug(`Clicked on list item ${m.data.listId}`, m)
            this.showDetails(m.data.listId)
        })

        this.onClick(this.clearCurrentKey, m => {
            log.debug(`Clicked clear key`, m)
            this.clearCurrent()
        })
    }


    /// Fetching and Loading

    /**
     * Subclasses must implement this to provide a list of items to render.
     */
    abstract fetchItems(): Promise<T[]>

    /**
     * Subclasses can override this to automatically load the first item in the list.
     */
    get shouldLoadFirstItem(): boolean {
        return false
    }

    /**
     * Fetches the items with `fetchItems()` and re-renders the list.
     */
    async reload() {
        this.items = await this.fetchItems()
        this.assignCollection('items', ListItemPart, this.items)
        this.getCollectionParts('items').forEach(itemPart => {
            // HACK
            (itemPart as ListItemPart<T>).viewer = this
            this.itemPartMap[itemPart.state.listId] = (itemPart as ListItemPart<T>)
        })

        // Determine whether the details should be shown inline with the list or off to the side, based on screen size
        if (window.innerWidth > PageBreakpoints.phone) {
            this.layout = 'side'
        } else {
            this.layout = 'inline'
        }
    }

    load() {
        super.load()

        // load the item specified by the listId param
        const params = parseQueryParams(location.search)
        const id = params.get('listId')
        if (id?.length && this.itemPartMap[id]) {
            log.info(`Showing item specified in params: ${id}`)
            this.showDetails(id)
        }
        else if (this.shouldLoadFirstItem) {
            const firstClickable = this.items.filter(item => item.listClickable)[0]
            if (firstClickable) {
                log.info(`Showing first clickable item`)
                this.showDetails(firstClickable.listId)
            } else {
                log.info(`No clickable items to show`)
            }
        }
    }


    /// Rendering

    get parentClasses(): Array<string> {
        return ['tt-list-viewer']
    }

    render(parent: PartTag): any {
        log.debug(`Rendering the viewer`)
        parent.div('.tt-list-viewer-list', list => {
            this.renderCollection(list, 'items')
        })
        if (this.layout == 'side') {
            log.debug(`Rendering sideContainerPart inside the viewer`)
            parent.part(this.sideContainerPart)
        }
    }

    /**
     * Subclasses must override this to render the content of an item.
     * @param parent
     * @param item
     */
    abstract renderListItem(parent: PartTag, item: T): any

    /**
     * Subclasses must implement this to render an item details or provide a part to do so.
     * @param context
     */
    abstract renderDetails(context: ListViewerDetailsContext<T>): any

    /**
     * Subclasses should override this to render custom content when there's no item selected (and layout=side).
     * @param parent
     */
    renderEmptyDetails(parent: PartTag) {
        parent.div(".text-center").text("Nothing to see here")
    }


    // Details

    /**
     * Show the details view for the item with the given id
     * @param id
     */
    showDetails(id: string) {
        this.detailsContext?.clear()

        const itemPart = this.itemPartMap[id]
        if (!itemPart) {
            log.warn(`No item part ${id}, ${Object.keys(this.itemPartMap).length} item parts: `, this.itemPartMap)
            return
        }

        this.detailsContext = new ListViewerDetailsContext(this, itemPart.state)
        this.detailsContext.itemPart = itemPart
        this.renderDetails(this.detailsContext)
        if (this.layout == 'side') {
            this.sideContainerPart.dirty()
        }
        itemPart.dirty()

        // update the url
        const params = parseQueryParams(location.search)
        params.raw['listId'] = id
        const url = location.pathname + '?' + params.serialize()
        history.replaceState(null, '', url)

        // let the world know
        this.emitMessage(this.detailsShownKey, {id})

    }


}