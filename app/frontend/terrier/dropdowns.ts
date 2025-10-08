import {Logger} from "tuff-core/logging"
import Messages from "tuff-core/messages"
import {PartTag, StatelessPart} from "tuff-core/parts"
import Overlays from "./overlays"
import TerrierPart from "./parts/terrier-part"
import Objects from "tuff-core/objects"
import {Action} from "./theme"
import Arrays from "tuff-core/arrays"

const log = new Logger('Dropdowns')

export const clearDropdownKey = Messages.untypedKey()

/**
 * Abstract base class for dropdown parts.
 * Subclasses must implement the `renderContent()` method to render the dropdown content.
 */
export abstract class Dropdown<TState> extends TerrierPart<TState> {

    parentPart?: StatelessPart

    get parentClasses(): Array<string> {
        return ['tt-dropdown', ...super.parentClasses]
    }

    /**
     * Override and return true to have the dropdown close when the user clicks anywhere outside of it.
     */
    get autoClose(): boolean {
        return false
    }

    // the computed absolute position of the
    left = 0
    top = 0

    async init() {
        this.onClick(clearDropdownKey, m => {
            log.info("Clearing dropdown", m)
            this.clear()
        })
    }

    /**
     * Removes itself from the DOM.
     */
    clear() {
        log.info("Clearing dropdown")
        this.app.removeDropdown(this.state)
    }

    render(parent: PartTag) {
        if (this.autoClose) {
            parent.div('.tt-dropdown-backdrop')
                .emitClick(clearDropdownKey)
        }
        parent.div('.tt-dropdown-content', content => {
            this.renderContent(content)
        })
    }

    /**
     * Subclasses must implement this to render the actual dropdown content.
     * @param parent
     */
    abstract renderContent(parent: PartTag): void

    anchorTarget?: HTMLElement

    /**
     * Store the anchor target in order to compute the dropdown position when it's rendered.
     * @param target
     */
    anchor(target: HTMLElement) {
        log.info(`Anchoring dropdown to target`, target)
        this.anchorTarget = target
    }

    update(_elem: HTMLElement) {
        const content: HTMLElement | null = _elem.querySelector('.tt-dropdown-content')
        if (content) {
            if (this.anchorTarget) {
                log.info(`Anchoring dropdown`, content, this.anchorTarget)
                Overlays.anchorElement(content as HTMLElement, this.anchorTarget)
            }
            else {
                // no anchor, just center it on the screen
                Overlays.centerElement(content as HTMLElement)
            }
            content.classList.add('show')
        }
    }

}

/**
 * A concrete dropdown part that shows a list of actions.
 */
export class ActionsDropdown extends Dropdown<Array<Action>> {

    get autoClose(): boolean {
        return true
    }

    get parentClasses(): Array<string> {
        return ['tt-actions-dropdown', ...super.parentClasses]
    }

    renderContent(parent: PartTag) {
        // handle each key declared on the actions directly,
        // then clear the dropdown and re-emit them on the parent part
        const keys = Arrays.unique(this.state.map(action => action.click?.key).filter(Objects.notNull))
        for (const key of keys) {
            this.onClick(key, m => {
                this.clear()
                log.info(`Re-emitting ${key.id} message`, m, this.parentPart)
                if (this.parentPart) {
                    this.parentPart.emit('click', key, m.event, m.data)
                } else {
                    this.emit('click', key, m.event, m.data)
                }
            })
        }
        this.theme.renderActions(parent, this.state, {iconColor: 'white'})
    }

}
