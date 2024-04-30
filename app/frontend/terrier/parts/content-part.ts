import {Action, IconName} from "../theme"
import {PartTag} from "tuff-core/parts"
import TerrierPart from "./terrier-part"

export type PanelActions = {
    primary: Array<Action>
    secondary: Array<Action>
    tertiary: Array<Action>
}
export type ActionLevel = keyof PanelActions

/**
 * Base class for all Parts that render some main content, like pages, panels, and modals.
 */
export default abstract class ContentPart<TState> extends TerrierPart<TState> {

    /**
     * All ContentParts must implement this to render their actual content.
     * @param parent
     */
    abstract renderContent(parent: PartTag): void


    render(parent: PartTag) {
        this.renderContent(parent)
    }


    protected _title = ''

    /**
     * Sets the page, panel, or modal title.
     * @param title
     */
    setTitle(title: string) {
        this._title = title
    }

    protected _icon: IconName | null = null

    setIcon(icon: IconName) {
        this._icon = icon
    }

    protected _titleClasses: string[] = []

    addTitleClass(c: string) {
        this._titleClasses.push(c)
    }


    /// Actions

    // stored actions can be either an action object or a reference to a named action
    private _actions = {
        primary: Array<Action | string>(),
        secondary: Array<Action | string>(),
        tertiary: Array<Action | string>()
    }

    private _namedActions: Record<string, { action: Action, level: ActionLevel }> = {}

    /**
     * Add an action to the part, or replace a named action if it already exists.
     * @param action the action to add
     * @param level whether it's a primary, secondary, or tertiary action
     * @param name a name to be given to this action, so it can be accessed later
     */
    addAction(action: Action, level: ActionLevel = 'primary', name?: string) {
        if (name?.length) {
            if (name in this._namedActions) {
                const currentLevel = this._namedActions[name].level
                if (level != currentLevel) {
                    const index = this._actions[currentLevel].indexOf(name)
                    this._actions[currentLevel].splice(index, 1)
                    this._actions[level].push(name)
                }
                this._namedActions[name].action = action
            } else {
                this._namedActions[name] = {action, level}
                this._actions[level].push(name)
            }
        } else {
            this._actions[level].push(action)
        }
    }

    /**
     * Returns the action definition for the action with the given name, or undefined if there is no action with that name
     * @param name
     */
    getNamedAction(name: string): Action | undefined {
        return this._namedActions[name].action
    }

    /**
     * Removes the action with the given name
     * @param name
     */
    removeNamedAction(name: string) {
        if (!(name in this._namedActions)) return
        const level = this._actions[this._namedActions[name].level]
        delete this._namedActions[name]
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
        for (const action of this._actions[level]) {
            if (typeof action === 'string') {
                delete this._namedActions[action]
            }
        }
        this._actions[level] = []
    }

    getAllActions(): PanelActions {
        return {
            primary: this.getActions('primary'),
            secondary: this.getActions('secondary'),
            tertiary: this.getActions('tertiary'),
        }
    }

    getActions(level: ActionLevel): Action[] {
        return this._actions[level].map(action => {
            return (typeof action === 'string') ? this._namedActions[action].action : action
        })
    }

    hasActions(level: ActionLevel): boolean {
        return this._actions[level].length > 0
    }
}