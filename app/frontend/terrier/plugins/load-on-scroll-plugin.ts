import {PartPlugin} from "tuff-core/plugins"
import {Logger} from "tuff-core/logging"
import {Part, PartConstructor} from "tuff-core/parts"

const log = new Logger('LoadOnScrollPlugin')

type MarginUnit = '%' | 'px'
type MarginLength = `${number}${MarginUnit}`
type MarginString = `${MarginLength} ${MarginLength} ${MarginLength} ${MarginLength}`
export type LoadOnScrollOptions<TState> = {
    // The name of the collection to load on scroll
    collectionName: string
    // The type of parts in the collection
    collectionPartType: PartConstructor<Part<TState>, TState>
    // Called to load the next state. If undefined is returned, no more states will be loaded
    loadNextStates: (existingStates: TState[]) => Promise<TState[] | undefined>
    // Percentage of the last item in the collection that must be visible before the next state is loaded.
    // If not provided, a default value of 25% is used. Must be between 0 and 1
    // See: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API#threshold
    intersectThreshold?: number
    // Defines a margin on the document that shifts when the last element is intersecting.
    // See: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API#rootmargin
    intersectRootMargin?: MarginString
    // Configure the intersection observer
    configureIntersect?: (builder: IntersectionObserverBuilder, partElem: HTMLElement) => any
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

        this.observer?.disconnect()
        if (this.observer) {
            this.observer.disconnect()
        } else {
            const builder = new IntersectionObserverBuilder(this.onIntersect.bind(this))
            builder.rootMargin(this.state.intersectRootMargin ?? '0px 0px 0px 0px')
            builder.threshold(this.state.intersectThreshold ?? 0.25)
            if (this.state.configureIntersect) {
                this.state.configureIntersect(builder, elem)
            }
            this.observer = builder.build()
        }
        this.observer.observe(lastElement)
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
            this.observer?.disconnect()
            this.observer = undefined
            this.part.removePlugin(this.id)
            return
        }
        partStates.push(...nextState)
        this.part.assignCollection(this.state.collectionName, this.state.collectionPartType, partStates)
        this.isLoading = false
        this.part.stale()
    }
}

export class IntersectionObserverBuilder {
    private readonly callback: IntersectionObserverCallback
    private readonly config: IntersectionObserverInit

    constructor(callback: IntersectionObserverCallback) {
        this.callback = callback
        this.config = {}
    }

    root(root: Element | Document | undefined): IntersectionObserverBuilder {
        this.config.root = root
        return this
    }

    rootMargin(margin: MarginString): IntersectionObserverBuilder {
        this.config.rootMargin = margin
        return this
    }

    threshold(threshold: number): IntersectionObserverBuilder {
        this.config.threshold = threshold
        return this
    }

    build() : IntersectionObserver {
        return new IntersectionObserver(this.callback, this.config)
    }
}