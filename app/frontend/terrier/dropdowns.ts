import { Logger } from "tuff-core/logging"
import { untypedKey } from "tuff-core/messages"
import { unique } from "tuff-core/arrays"
import {PartTag, StatelessPart} from "tuff-core/parts"
import Overlays from "./overlays"
import {TerrierPart} from "./parts"
import Objects from "tuff-core/objects"
import Theme, {Action, ThemeType} from "./theme"
import {TerrierApp} from "./app";

const log = new Logger('Dropdowns')

const clearDropdownKey = untypedKey()

/**
 * Abstract base class for dropdown parts.
 * Subclasses must implement the `renderContent()` method to render the dropdown content.
 */
export abstract class Dropdown<
    TState,
    TThemeType extends ThemeType,
    TApp extends TerrierApp<TThemeType, TApp, TTheme>,
    TTheme extends Theme<TThemeType>
> extends TerrierPart<TState, TThemeType, TApp, TTheme> {

    parentPart?: StatelessPart

    get parentClasses(): Array<string> {
        return ['tt-dropdown', ...super.parentClasses]
    }

    // the computed absolute position of the
    left = 0
    top = 0

    async init() {
        this.onClick(clearDropdownKey, _ => {
            this.clear()
        })
    }

    /**
     * Removes itself from the DOM.
     */
    clear() {
        log.info("Clearing dropdown")
        this.app.clearOverlay('dropdown')
    }

    render(parent: PartTag) {
        parent.div('.dropdown-content', content => {
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
        const content = _elem.querySelector('.dropdown-content')
        if (this.anchorTarget && content) {
            log.info(`Anchoring dropdown`, content, this.anchorTarget)
            Overlays.anchorElement(content as HTMLElement, this.anchorTarget)
            content.classList.add('show')
        }
    }

}

/**
 * A concrete dropdown part that shows a list of actions.
 */
export class ActionsDropdown<
    TThemeType extends ThemeType,
    TApp extends TerrierApp<TThemeType, TApp, TTheme>,
    TTheme extends Theme<TThemeType>
> extends Dropdown<Array<Action<TThemeType>>, TThemeType, TApp, TTheme> {


    get parentClasses(): Array<string> {
        return ['tt-actions-dropdown', ...super.parentClasses]
    }

    renderContent(parent: PartTag) {
        // handle each key declared on the actions directly,
        // then clear the dropdown and re-emit them on the parent part
        const keys = unique(this.state.map(action => action.click?.key).filter(Objects.notNull))
        for (const key of keys) {
            this.onClick(key, m => {
                this.app.clearOverlay('dropdown')
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
