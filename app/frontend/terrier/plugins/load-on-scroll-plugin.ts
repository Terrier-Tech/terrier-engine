import {PartPlugin} from "tuff-core/plugins"
import {Logger} from "tuff-core/logging"
import {Part, PartConstructor} from "tuff-core/parts"

const log = new Logger('LoadOnScrollPlugin')

export type LoadOnScrollOptions<TState> = {
    // The name of the collection to load on scroll
    collectionName: string
    // The type of parts in the collection
    collectionPartType: PartConstructor<Part<TState>, TState>
    // Called to load the next state. If undefined is returned, no more states will be loaded
    loadNextStates: (existingStates: TState[]) => Promise<TState[] | undefined>
}

/**
 * Given a collection name, loads more elements into the collection as the user continues to scroll.
 * When the last item of the collection is in view, it will begin to load the next element.
 */
export default class LoadOnScrollPlugin<TState> extends PartPlugin<LoadOnScrollOptions<TState>> {
    private observer?: IntersectionObserver

    update(elem: HTMLElement) {
        super.update(elem)

        const collectionParts = this.part.getCollectionParts(this.state.collectionName)

        const lastPart = collectionParts[collectionParts.length - 1]
        if (!lastPart) return

        const lastElement = elem.querySelector(`#${lastPart.id}`)
        if (!lastElement) {
            log.warn(`No element for last part in collection ${this.state.collectionName}`, lastPart)
            return
        }

        const collectionContainer = this.part.getCollectionContainer(this.state.collectionName)
        if (this.observer == undefined || this.observer.root != collectionContainer) {
            // The old observer is referencing an old collection container so we need to create a new one
            this.observer = new IntersectionObserver(this.onIntersect.bind(this), {
                root: collectionContainer,
                threshold: 0.25,
            })
        } else {
            this.observer.disconnect()
        }
        this.observer.observe(lastElement)
    }

    private onIntersect(entries: IntersectionObserverEntry[], obs: IntersectionObserver) {
        if (entries.length && entries[0].isIntersecting) {
            obs.unobserve(entries[0].target)
            this.loadNextState().then()
        }
    }

    private async loadNextState() {
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
        this.part.stale()
    }
}