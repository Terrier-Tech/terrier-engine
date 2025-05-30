import {PartPlugin} from "tuff-core/plugins"
import {Logger} from "tuff-core/logging"
import {Part, PartConstructor} from "tuff-core/parts"

const log = new Logger('LoadOnScrollPlugin')

type MarginUnit = '%' | 'px'
type MarginLength = `${number}${MarginUnit}`
type MarginString = MarginLength | `${MarginLength} ${MarginLength}` | `${MarginLength} ${MarginLength} ${MarginLength} ${MarginLength}`

/**
 * Define the behavior of the load on scroll functionality.
 * For information about the intersect parameters, see https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
 */
export type LoadOnScrollOptions<TState> = {
    // The name of the collection to load on scroll
    collectionName: string
    // The type of parts in the collection
    collectionPartType: PartConstructor<Part<TState>, TState>
    // Called to load the next state. If undefined is returned, no more states will be loaded
    loadNextStates: (existingStates: TState[]) => Promise<TState[] | undefined>
    // The root element whose viewport is scrolling. If not provided, the document viewport is used.
    // Usually not required, but if using intersectThreshold on a scrollable element, might be necessary.
    intersectRootSelector?: string
    // Percentage of the last item in the collection that must be visible before the next state is loaded.
    // If not provided, a default value of 25% is used. Must be between 0 and 1.
    intersectThreshold?: number
    // Expands the intersection region by the specified margin.
    intersectRootMargin?: MarginString
}

/**
 * Given a collection name, loads more elements into the collection as the user continues to scroll.
 * When the last item of the collection is in view, it will begin to load the next element.
 */
export default class LoadOnScrollPlugin<TState> extends PartPlugin<LoadOnScrollOptions<TState>> {
    private observer?: IntersectionObserver

    private isLoading = false

    update(elem: HTMLElement) {
        super.update(elem)

        if (this.isLoading) return

        const collectionParts = this.part.getCollectionParts(this.state.collectionName)

        const lastPart = collectionParts[collectionParts.length - 1]
        if (!lastPart) return

        const lastElement = elem.querySelector(`#${lastPart.id}`)
        if (!lastElement) {
            log.warn(`No element for last part in collection ${this.state.collectionName}`, lastPart)
            return
        }

        const intersectRoot = (this.state.intersectRootSelector) ? elem.querySelector(this.state.intersectRootSelector) : null

        // We may have re-rendered since the last update, in which case the intersectionRoot will be a new element.
        // In that case, recreate observer with the new root.
        if (!this.observer || this.observer.root !== intersectRoot) {
            const config: IntersectionObserverInit = {
                root: intersectRoot,
                rootMargin: this.state.intersectRootMargin ?? '0px 0px 0px 0px',
                threshold: this.state.intersectThreshold ?? 0.25,
            }
            this.observer?.disconnect()
            this.observer = new IntersectionObserver(this.onIntersect.bind(this), config)
        } else {
            this.observer.disconnect()
        }
        this.observer.observe(lastElement)
    }

    remove() {
        this.observer?.disconnect()
        this.observer = undefined
    }

    private onIntersect(entries: IntersectionObserverEntry[], obs: IntersectionObserver) {
        if (this.isLoading) return
        if (entries.length == 0 || !entries[0].isIntersecting) return
        obs.disconnect()
        this.loadNextState().then()
    }

    private async loadNextState() {
        this.isLoading = true
        const partStates = this.part.getCollectionParts(this.state.collectionName).map(p => p.state) as TState[]
        const nextState = await this.state.loadNextStates(partStates)
        if (nextState === undefined) {
            // No more states to load; remove the plugin to avoid additional loads
            this.part.removePlugin(this.id)
            return
        }
        partStates.push(...nextState)
        this.part.assignCollection(this.state.collectionName, this.state.collectionPartType, partStates)
        this.isLoading = false
        this.part.stale()
    }
}