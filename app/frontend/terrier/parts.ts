import { Logger } from "tuff-core/logging"
import { Part } from "tuff-core/parts"
import {PartParent, PartTag, NoState} from "tuff-core/parts"
import Fragments from "./fragments"
import {Dropdown} from "./dropdowns"
import {TerrierApp} from "./app"
import Loading from "./loading"
import Theme, {Action, RenderActionOptions, ThemeType} from "./theme"
import Toasts, {ToastOptions} from "./toasts";
import {FormPart, FormPartData} from "tuff-core/forms"

const log = new Logger('Parts')

export type PanelActions<TT extends ThemeType> = {
    primary: Array<Action<TT>>
    secondary: Array<Action<TT>>
    tertiary: Array<Action<TT>>
}

export type ActionLevel = keyof PanelActions<any>


////////////////////////////////////////////////////////////////////////////////
// Terrier Part
////////////////////////////////////////////////////////////////////////////////

/**
 * Base class for ALL parts in a Terrier application.
 */
export abstract class TerrierPart<
    TState,
    TThemeType extends ThemeType,
    TApp extends TerrierApp<TThemeType, TTheme>,
    TTheme extends Theme<TThemeType>
> extends Part<TState> {

    get app(): TApp {
        return this.root as TApp // this should always be true
    }

    get theme(): TTheme {
        return this.app.theme
    }

    /// Loading

    /**
     * This can be overloaded if the loading overlay should go
     * somewhere other than the part's root element.
     */
    getLoadingContainer(): Element | null | undefined {
        return this.element
    }


    /**
     * Shows the loading animation on top of the part.
     */
    startLoading() {
        const elem = this.getLoadingContainer()
        if (!elem) {
            return
        }
        Loading.showOverlay(elem, this.theme)
    }

    /**
     * Removes the loading animation from the part.
     */
    stopLoading() {
        const elem = this.getLoadingContainer()
        if (!elem) {
            return
        }
        Loading.removeOverlay(elem)
    }

    /**
     * Shows the loading overlay until the given function completes (either returns successfully or throws an exception)
     * @param func
     */
    showLoading(func: () => void): void
    showLoading(func: () => Promise<void>): Promise<void>
    showLoading(func: () => void | Promise<void>): void | Promise<void>  {
        this.startLoading()
        let stopImmediately = true
        try {
            const res = func()
            if (res) {
                stopImmediately = false
                return res.finally(() => {
                    this.stopLoading()
                })
            }
        } finally {
            if (stopImmediately) {
                this.stopLoading()
            }
        }
    }


    /// Toasts

    /**
     * Shows a toast message in a bubble in the upper right corner.
     * @param message the message text
     * @param options
     */
    showToast(message: string, options: ToastOptions<TThemeType>) {
        Toasts.show(message, options, this.theme)
    }

}


////////////////////////////////////////////////////////////////////////////////
// Content Part
////////////////////////////////////////////////////////////////////////////////

/**
 * Base class for all Parts that render some main content, like pages, panels, and modals.
 */
export abstract class ContentPart<TState, TThemeType extends ThemeType> extends TerrierPart<
    TState,
    TThemeType,
    TerrierApp<TThemeType, Theme<TThemeType>>,
    Theme<TThemeType>
> {

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

    protected _breadcrumbClasses: string[] = []

    addBreadcrumbClass(c: string) {
        this._breadcrumbClasses.push(c)
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
                this.namedActions[name] = { action, level }
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
    makeDropdown<DropdownType extends Dropdown<DropdownStateType, TThemeType>, DropdownStateType>(
        constructor: {new(p: PartParent, id: string, state: DropdownStateType): DropdownType;},
        state: DropdownStateType,
        target: EventTarget | null) {
        if (!(target && target instanceof HTMLElement)) {
            throw "Trying to show a dropdown without an element target!"
        }
        const dropdown = this.app.makeOverlay(constructor, state, 'dropdown') as Dropdown<DropdownStateType, TThemeType>
        dropdown.parentPart = this
        dropdown.anchor(target)
        this.app.lastDropdownTarget = target
    }

    clearDropdown() {
        this.app.clearOverlay('dropdown')
    }

    /**
     * Calls `makeDropdown` only if there's not a dropdown currently originating from the target.
     * @param constructor a constructor for a dropdown part
     * @param state the dropdown's state
     * @param target the target element around which to show the dropdown
     */
    toggleDropdown<DropdownType extends Dropdown<DropdownStateType, TThemeType>, DropdownStateType>(
        constructor: { new(p: PartParent, id: string, state: DropdownStateType): DropdownType; },
        state: DropdownStateType,
        target: EventTarget | null) {
        if (target && target instanceof HTMLElement && target == this.app.lastDropdownTarget) {
            this.clearDropdown()
        } else {
            this.makeDropdown(constructor, state, target)
        }
    }

}


////////////////////////////////////////////////////////////////////////////////
// Page
////////////////////////////////////////////////////////////////////////////////

/**
 * Whether some content should be constrained to a reasonable width or span the entire screen.
 */
export type ContentWidth = "normal" | "wide"


/**
 * A part that renders content to a full page.
 */
export abstract class PagePart<T, TT extends ThemeType> extends ContentPart<T, TT> {

    /// Breadcrumbs

    private _breadcrumbs = Array<Action<TT>>()

    addBreadcrumb(crumb: Action<TT>) {
        this._breadcrumbs.push(crumb)
    }


    /**
     * Sets both the page title and the last breadcrumb.
     * @param title
     */
    setTitle(title: string) {
        super.setTitle(title)
        document.title = `${title} :: Terrier Hub`
    }

    private _titleHref?: string

    /**
     * Adds an href to the title (last) breadcrumb.
     * @param href
     */
    setTitleHref(href: string) {
        this._titleHref = href
    }

    /**
     * Whether the main content should be constrained to a reasonable width (default) or span the entire screen.
     */
    protected mainContentWidth: ContentWidth = "normal"

    render(parent: PartTag) {
        parent.div(`.tt-page-part.content-width-${this.mainContentWidth}`, page => {
            page.div('.tt-flex.top-row', topRow => {
                this.renderBreadcrumbs(topRow);

                if (this.actions.tertiary.length) {
                    this.renderActions(topRow, 'tertiary');
                }
            })

            page.div('.lighting')
            page.div('.page-main', main => {
                this.renderContent(main)
                main.div('.page-actions', actions => {
                    this.renderActions(actions, 'secondary', {iconColor: null, defaultClass: 'secondary'})
                    this.renderActions(actions, 'primary', {iconColor: null, defaultClass: 'primary'})
                })
            })
        })
    }

    protected renderActions(parent: PartTag, level: ActionLevel, options?: RenderActionOptions<TT>) {
        parent.div(`.${level}-actions`, actions => {
            this.app.theme.renderActions(actions, this.getActions(level), options)
        })
    }

    protected renderBreadcrumbs(parent: PartTag) {
        if (!this._breadcrumbs.length && !this._title?.length) return

        parent.h1('.breadcrumbs', h1 => {
            const crumbs = Array.from(this._breadcrumbs)

            // add a breadcrumb for the page title
            const titleCrumb: Action<TT> = {
                title: this._title,
                icon: this._icon || undefined,
            }
            if (this._titleHref) {
                titleCrumb.href = this._titleHref
            }
            if (this._breadcrumbClasses?.length) {
                titleCrumb.classes = this._breadcrumbClasses
            }
            crumbs.push(titleCrumb)

            this.app.theme.renderActions(h1, crumbs)
        })
    }
}



/**
 * Default page part if the router can't find the path.
 */
export class NotFoundRoute<TT extends ThemeType> extends PagePart<NoState, TT> {
    async init() {
        this.setTitle("Page Not Found")
    }

    renderContent(parent: PartTag) {
        log.warn(`Not found: ${this.context.href}`)
        parent.h1({text: "Not Found"})
    }

}


////////////////////////////////////////////////////////////////////////////////
// Panel
////////////////////////////////////////////////////////////////////////////////

/**
 * A part that renders content inside a panel.
 */
export abstract class PanelPart<T, TT extends ThemeType> extends ContentPart<T, TT> {

    getLoadingContainer() {
        return this.element?.getElementsByClassName('tt-panel')[0]
    }

    protected get panelClasses(): string[] {
        return []
    }

    render(parent: PartTag) {
        parent.div('.tt-panel', panel => {
            panel.class(...this.panelClasses)
            if (this._title?.length || this.actions.tertiary.length) {
                panel.div('.panel-header', header => {
                    header.h2(h2 => {
                        if (this._icon) {
                            this.app.theme.renderIcon(h2, this._icon, 'link')
                        }
                        h2.div('.title', {text: this._title || 'Call setTitle()'})
                    })
                    this.theme.renderActions(header, this.getActions('tertiary'))
                })
            }
            panel.div('.panel-content', content => {
                this.renderContent(content)
            })
            Fragments.panelActions(panel, this.getAllActions(), this.theme)
        })
    }
}


////////////////////////////////////////////////////////////////////////////////
// Form Part
////////////////////////////////////////////////////////////////////////////////

export abstract class ThemedFormPart<
    TState extends FormPartData,
    TThemeType extends ThemeType,
    TApp extends TerrierApp<TThemeType, TTheme>,
    TTheme extends Theme<TThemeType>
> extends FormPart<TState> {


    get app(): TApp {
        return this.root as TApp // this should always be true
    }

    get theme(): TTheme {
        return this.app.theme
    }

}