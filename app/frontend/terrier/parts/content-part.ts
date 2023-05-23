import Theme, {Action, ThemeType} from "../theme"
import {TerrierApp} from "../app"
import {PartParent, PartTag} from "tuff-core/parts"
import {Dropdown} from "../dropdowns"
import TerrierPart from "./terrier-part"

export type PanelActions<TT extends ThemeType> = {
    primary: Array<Action<TT>>
    secondary: Array<Action<TT>>
    tertiary: Array<Action<TT>>
}
export type ActionLevel = keyof PanelActions<any>

/**
 * Base class for all Parts that render some main content, like pages, panels, and modals.
 */
export default abstract class ContentPart<
    TState,
    TThemeType extends ThemeType,
    TApp extends TerrierApp<TThemeType, TApp, TTheme>,
    TTheme extends Theme<TThemeType>
> extends TerrierPart<TState, TThemeType, TApp, TTheme> {

    /**
     * All ContentParts must implement this to render their actual content.
     * @param parent
     */
    abstract renderContent(parent: PartTag): void


    protected _title = ''

    /**
     * Sets the page, panel, or modal title.
     * @param title
     */
    setTitle(title: string) {
        this._title = title
    }

    protected _icon: TThemeType['icons'] | null = null

    setIcon(icon: TThemeType['icons']) {
        this._icon = icon
    }

    protected _titleClasses: string[] = []

    addTitleClass(c: string) {
        this._titleClasses.push(c)
    }


    /// Actions

    // stored actions can be either an action object or a reference to a named action
    actions = {
        primary: Array<Action<TThemeType> | string>(),
        secondary: Array<Action<TThemeType> | string>(),
        tertiary: Array<Action<TThemeType> | string>()
    }

    namedActions: Record<string, { action: Action<TThemeType>, level: ActionLevel }> = {}

    /**
     * Add an action to the part, or replace a named action if it already exists.
     * @param action the action to add
     * @param level whether it's a primary, secondary, or tertiary action
     * @param name a name to be given to this action, so it can be accessed later
     */
    addAction(action: Action<TThemeType>, level: ActionLevel = 'primary', name?: string) {
        if (name?.length) {
            if (name in this.namedActions) {
                const currentLevel = this.namedActions[name].level
                if (level != currentLevel) {
                    const index = this.actions[currentLevel].indexOf(name)
                    this.actions[currentLevel].splice(index, 1)
                    this.actions[level].push(name)
                }
                this.namedActions[name].action = action
            } else {
                this.namedActions[name] = {action, level}
                this.actions[level].push(name)
            }
        } else {
            this.actions[level].push(action)
        }
    }

    /**
     * Returns the action definition for the action with the given name, or undefined if there is no action with that name
     * @param name
     */
    getNamedAction(name: string): Action<TThemeType> | undefined {
        return this.namedActions[name].action
    }

    /**
     * Removes the action with the given name
     * @param name
     */
    removeNamedAction(name: string) {
        if (!(name in this.namedActions)) return
        const level = this.actions[this.namedActions[name].level]
        delete this.namedActions[name]
        const actionIndex = level.indexOf(name)
        if (actionIndex >= 0) {
            level.splice(actionIndex, 1)
        }
    }

    /**
     * Clears the actions for this part
     * @param level whether to clear the primary, secondary, or both sets of actions
     */
    clearActions(level: ActionLevel) {
        for (const action of this.actions[level]) {
            if (typeof action === 'string') {
                delete this.namedActions[action]
            }
        }
        this.actions[level] = []
    }

    getAllActions(): PanelActions<TThemeType> {
        return {
            primary: this.getActions('primary'),
            secondary: this.getActions('secondary'),
            tertiary: this.getActions('tertiary'),
        }
    }

    getActions(level: ActionLevel): Action<TThemeType>[] {
        return this.actions[level].map(action => {
            return (typeof action === 'string') ? this.namedActions[action].action : action
        })
    }


    /// Dropdowns

    /**
     * Shows the given dropdown part on the page.
     * It's generally better to call `toggleDropdown` instead so that the dropdown will be
     * hidden upon a subsequent click on the target.
     * @param constructor a constructor for a dropdown part
     * @param state the dropdown's state
     * @param target the target element around which to show the dropdown
     */
    makeDropdown<DropdownType extends Dropdown<DropdownStateType, TThemeType, TApp, TTheme>, DropdownStateType extends {}>(
        constructor: { new(p: PartParent, id: string, state: DropdownStateType): DropdownType; },
        state: DropdownStateType,
        target: EventTarget | null) {
        if (!(target && target instanceof HTMLElement)) {
            throw "Trying to show a dropdown without an element target!"
        }
        const dropdown = this.app.addOverlay(constructor, state, 'dropdown')
        dropdown.parentPart = this
        dropdown.anchor(target)
        this.app.lastDropdownTarget = target
    }

    clearDropdowns() {
        this.app.clearDropdowns()
    }

    /**
     * Calls `makeDropdown` only if there's not a dropdown currently originating from the target.
     * @param constructor a constructor for a dropdown part
     * @param state the dropdown's state
     * @param target the target element around which to show the dropdown
     */
    toggleDropdown<DropdownType extends Dropdown<DropdownStateType, TThemeType, TApp, TTheme>, DropdownStateType extends {}>(
        constructor: { new(p: PartParent, id: string, state: DropdownStateType): DropdownType; },
        state: DropdownStateType,
        target: EventTarget | null) {
        if (target && target instanceof HTMLElement && target == this.app.lastDropdownTarget) {
            this.clearDropdowns()
        } else {
            this.makeDropdown(constructor, state, target)
        }
    }

}