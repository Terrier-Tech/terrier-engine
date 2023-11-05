import TerrierPart from "./parts/terrier-part"
import {Part, PartConstructor, PartTag, StatelessPart} from "tuff-core/parts"
import Messages from "tuff-core/messages"
import {Logger} from "tuff-core/logging"
import {DivTag} from "tuff-core/html";
import {PageBreakpoints} from "./parts/page-part";

const log = new Logger('List Viewer')

/**
 * Optional values to return from rendering a list item that control
 * its rendering behavior.
 */
export type ListItemRenderOptions = {
    style?: 'panel' | 'header'
    clickable?: boolean
}

/**
 * All list items should have an `id` value so that we can distinguish them.
 */
export type ListItem = {id: string}

/**
 * One of these gets created for each item in the list.
 */
class ListItemPart<T extends ListItem> extends Part<T> {

    viewer!: ListViewerPart<T>

    render(parent: PartTag) {
        const isCurrent = this.viewer.detailsContext?.id == this.state.id

        parent.div('.tt-list-viewer-item', itemView => {
            const opts = this.viewer.renderListItem(itemView, this.state)
            const style = opts?.style || 'panel'
            itemView.class(style)
            if (opts?.clickable) {
                itemView.class('clickable')
                itemView.emitClick(this.viewer.itemClickedKey, {id: this.state.id})
            }
            if (isCurrent) {
                itemView.class('current')
            }
        }).id(`item-${this.state.id}`)

        // render the details if this is the current item and it's supposed to be rendered inline
        if (isCurrent && this.viewer.detailsLocation == 'inline') {
            if (this.viewer.currentDetailsPart) {
                parent.part(this.viewer.currentDetailsPart)
            }
            else if (this.viewer.currentDetailsDiv) {
                parent.div().append(this.viewer.currentDetailsDiv)
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
        return this.item.id
    }

    /**
     * The part created by `makePart()` to render the details.
     */
    part?: StatelessPart

    /**
     * The part representing this item in the list.
     */
    itemPart?: ListItemPart<T>

    /**
     * The tag rendered by `renderDirect()` to represent the details until
     * the details part renders (if that happens at all).
     */
    directDiv?: DivTag

    constructor(readonly viewer: ListViewerPart<T>, readonly item: T) {
    }

    /**
     * Make a part to render the details for the list item.
     * @param partType
     * @param state
     */
    makePart<PartType extends Part<StateType>, StateType>(partType: PartConstructor<PartType, StateType>, state: StateType) {
        this.part = this.viewer.makePart(partType, state)
    }

    /**
     * Render the content for the details directly.
     * This will be replaced by the part made by `makePart()`.
     * @param fn the render function for the content
     */
    renderDirect(fn: (parent: DivTag) => any) {
        this.directDiv = new DivTag("div")
        fn(this.directDiv)
        return this.directDiv
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
        if (this.viewer.detailsLocation == 'side') {
            if (this.viewer.currentDetailsPart) {
                parent.part(this.viewer.currentDetailsPart)
            } else if (this.viewer.currentDetailsDiv) {
                parent.div().append(this.viewer.currentDetailsDiv)
            }
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
    detailsLocation: 'inline' | 'side' = 'inline'

    get currentDetailsPart(): StatelessPart | undefined  {
        return this.detailsContext?.part
    }

    get currentDetailsDiv(): DivTag | undefined  {
        return this.detailsContext?.directDiv
    }

    items: T[] = []
    itemPartMap: Record<string, ListItemPart<T>> = {}

    itemClickedKey = Messages.typedKey<ListItem>()

    /**
     * A message with this key gets emitted whenever the details are shown.
     */
    detailsShownKey = Messages.typedKey<{ id: string }>()

    async init() {
        await super.init()

        this.computeDetailsLocation()
        this.sideContainerPart = this.makePart(SideContainerPart, {viewer: this})

        await this.reload()

        this.onClick(this.itemClickedKey, m => {
            log.info(`Clicked on list item ${m.data.id}`, m)
            this.showDetails(m.data.id)
        })
    }


    /// Fetching

    /**
     * Subclasses must implement this to provide a list of items to render.
     */
    abstract fetchItems(): Promise<T[]>

    /**
     * Fetches the items with `fetchItems()` and re-renders the list.
     */
    async reload() {
        this.items = await this.fetchItems()
        this.assignCollection('items', ListItemPart, this.items)
        this.getCollectionParts('items').forEach(itemPart => {
            // HACK
            (itemPart as ListItemPart<T>).viewer = this
            log.info(`Adding item part ${itemPart.state.id}`, itemPart)
            this.itemPartMap[itemPart.state.id] = (itemPart as ListItemPart<T>)
        })
        this.dirty()
    }


    /// Rendering

    get parentClasses(): Array<string> {
        return ['tt-list-viewer']
    }

    render(parent: PartTag): any {
        parent.div('.tt-list-viewer-list', list => {
            this.renderCollection(list, 'items')
        })
        parent.part(this.sideContainerPart)
    }

    /**
     * Subclasses must override this to render the content of an item.
     * @param parent
     * @param item
     */
    abstract renderListItem(parent: PartTag, item: T): ListItemRenderOptions | void

    /**
     * Subclasses must implement this to render an item details or provide a part to do so.
     * @param context
     */
    abstract renderDetails(context: ListViewerDetailsContext<T>): any


    // Details

    /**
     * Determine whether the details should be shown inline with the list or
     * off to the side, based on screen size.
     */
    computeDetailsLocation() {
        if (window.innerWidth > PageBreakpoints.phone) {
            this.detailsLocation = 'side'
        }
        else {
            this.detailsLocation = 'inline'
        }
    }

    /**
     * Show the details view for the item with the given id
     * @param id
     */
    showDetails(id: string) {
        this.detailsContext?.clear()

        const itemPart = this.itemPartMap[id]
        if (!itemPart) {
            log.info(`${Object.keys(this.itemPartMap).length} item parts: `, this.itemPartMap)
            throw `No item part ${id}`
        }

        this.detailsContext = new ListViewerDetailsContext(this, itemPart.state)
        this.renderDetails(this.detailsContext)
        this.sideContainerPart.dirty()
        this.detailsContext.itemPart = itemPart
        itemPart.dirty()

        // let the world know
        this.emitMessage(this.detailsShownKey, {id})

    }


}