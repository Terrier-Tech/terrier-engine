import { AnchorTag, AnchorTagAttrs, DivTag, DivTagAttrs } from "tuff-core/html"
import Messages from "tuff-core/messages"
import { PartTag } from "tuff-core/parts"
import { PartPlugin } from "tuff-core/plugins"
import Strings from "tuff-core/strings"
import { InlineStyle, TagArgs } from "tuff-core/tags"

export type CollapsibleState = 'expanded' | 'collapsed'
export type CollapsibleOptions = {
    collapsibleState?: CollapsibleState
    collapserTransitionOptions?: TransitionOptions
    containerTransitionOptions?: TransitionOptions
}
export type TransitionOptions = {
    css?: InlineStyle
    durationMs?: number
}

export default class CollapsiblePlugin extends PartPlugin<CollapsibleOptions> {
    transitionKey = Messages.typedKey<{ forceState?: CollapsibleState }>()

    async init() {
        this.state.collapsibleState ??= 'expanded'
        this.state.collapserTransitionOptions ??= {}
        this.state.collapserTransitionOptions.css ??= { rotate: '-0.25turn' }

        this.part.onClick(this.transitionKey, () => {
            this.toggleState()
        })
    }

    toggleState(forceState?: CollapsibleState) {
        if (this.state.collapsibleState === forceState) return
        if (forceState) {
            this.state.collapsibleState = forceState
        } else {
            this.state.collapsibleState = this.state.collapsibleState == 'collapsed' ? 'expanded' : 'collapsed'
        }
        this.part.stale()
    }

    renderCollapser(parent: PartTag, ...args: TagArgs<AnchorTag,AnchorTagAttrs>[]): AnchorTag {
        const collapser = parent.child(AnchorTag, 'a', '.tt-collapser', ...args)
            .dataAttr('collapsibleState', this.state.collapsibleState)
            .dataAttr('collapsiblePluginId', this.id)

        if (this.state.collapsibleState == 'collapsed') {
            collapser.css(this.state.collapserTransitionOptions!.css!)
        }

        collapser.css({ transitionProperty: Object.keys(this.state.collapserTransitionOptions!.css!).join(", ") })
        if (this.state.collapserTransitionOptions?.durationMs) {
            collapser.cssVar('--tt-animation-duration', `${this.state.collapserTransitionOptions.durationMs}ms`)
        }

        collapser.emitClick(this.transitionKey, {})
        return collapser
    }

    renderContainer(parent: PartTag, ...args: TagArgs<DivTag,DivTagAttrs>[]): DivTag {
        const container = parent.div('.tt-collapsible-container')
            .dataAttr('collapsible-state', this.state.collapsibleState)
            .dataAttr('collapsiblePluginId', this.id)

        container.child(DivTag, 'div', '.tt-collapsible-content', ...args)

        const transitionProperties = ['grid-template-rows']
        if (this.state.containerTransitionOptions?.css) {
            transitionProperties.push(...Object.keys(this.state.containerTransitionOptions.css).map(Strings.ropeCase))

            if (this.state.collapsibleState == 'collapsed') {
                container.css(this.state.containerTransitionOptions.css)
            }
        }
        container.css({ transitionProperty: transitionProperties.join(", ") })
        if (this.state.containerTransitionOptions?.durationMs) {
            container.cssVar('--tt-animation-duration', `${this.state.containerTransitionOptions.durationMs}ms`)
        }
        return container
    }

    update(elem: HTMLElement) {
        super.update(elem)

        const containers = elem.querySelectorAll<HTMLElement>(`.tt-collapsible-container[data-collapsible-plugin-id=${this.id}]`)
        const collapsers = elem.querySelectorAll<HTMLElement>(`.tt-collapser[data-collapsible-plugin-id=${this.id}]`)

        containers.forEach(container => {
            container.dataset.collapsibleState = this.state.collapsibleState
            if (this.state.containerTransitionOptions?.css && this.state.collapsibleState == 'collapsed') {
                setCssProperties(container, this.state.containerTransitionOptions.css)
            } else if (this.state.containerTransitionOptions?.css) {
                unsetCssProperties(container, Object.keys(this.state.containerTransitionOptions.css))
            }
        })

        collapsers.forEach(collapser => {
            collapser.dataset.collapsibleState = this.state.collapsibleState
            if (this.state.collapsibleState == 'collapsed') {
                setCssProperties(collapser, this.state.collapserTransitionOptions!.css!)
            } else {
                unsetCssProperties(collapser, Object.keys(this.state.collapserTransitionOptions!.css!))
            }
        })
    }
}

function setCssProperties(elem: HTMLElement, properties: InlineStyle) {
    for (const [prop, value] of Object.entries(properties)) {
        elem.style.setProperty(Strings.ropeCase(prop), value as string)
    }
}

function unsetCssProperties(elem: HTMLElement, properties: string[]) {
    for (const prop of properties) {
        elem.style.removeProperty(Strings.ropeCase(prop))
    }
}