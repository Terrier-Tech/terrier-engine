import {Action, IconName, RenderActionOptions} from "../theme"
import ContentPart, {ActionLevel} from "./content-part"
import {PartTag} from "tuff-core/parts"
import {optionsForSelect, SelectOptions} from "tuff-core/forms"
import {UntypedKey} from "tuff-core/messages"
import {Logger} from "tuff-core/logging"

const log = new Logger("Terrier PagePart")

/**
 * Whether some content should be constrained to a reasonable width or span the entire screen.
 */
export type ContentWidth = "normal" | "wide" | "fill"

/**
 * The width breakpoints for various device classes used by the styles.
 */
export const PageBreakpoints = {
    phone: 550,
    mobile: 850,
    tablet: 1050,
    fixed: 320
}

/// Toolbar fields

type BaseFieldDef = { name: string } & ToolbarFieldDefOptions

type ToolbarFieldDefOptions = {
    onChangeKey?: UntypedKey
    onInputKey?: UntypedKey
    defaultValue?: string
    tooltip?: string
    title?: string
    icon?: IconName
}

type ToolbarSelectDef = { type: 'select', options: SelectOptions } & BaseFieldDef

type ValuedInputType = 'text' | 'color' | 'date' | 'datetime-local' | 'email' | 'hidden' | 'month' | 'number' | 'password' | 'search' | 'tel' | 'time' | 'url' | 'week' | 'checkbox'
type ToolbarValuedInputDef = { type: ValuedInputType } & BaseFieldDef

/**
 * Defines a field to be rendered in the page's toolbar
 */
type ToolbarFieldDef = ToolbarSelectDef | ToolbarValuedInputDef

/**
 * A part that renders content to a full page.
 */
export default abstract class PagePart<TState> extends ContentPart<TState> {

    /// Content Width

    /**
     * Whether the main content should be constrained to a reasonable width (default) or span the entire screen.
     */
    protected mainContentWidth: ContentWidth = "normal"

    /// Breadcrumbs

    protected _breadcrumbs = Array<Action>()

    addBreadcrumb(crumb: Action) {
        this._breadcrumbs.push(crumb)
    }

    protected _titleHref?: string

    /**
     * Adds an href to the title (last) breadcrumb.
     * @param href
     */
    setTitleHref(href: string) {
        this._titleHref = href
    }

    /// Toolbar Fields

    protected _toolbarFieldsOrder: string[] = []
    protected _toolbarFields: Record<string, ToolbarFieldDef> = {}

    protected get hasToolbarFields() {
        return this._toolbarFieldsOrder.length > 0
    }

    /**
     * Adds a select to the toolbar with the given options.
     * @param name the name of the select
     * @param selectOptions an array of select options
     * @param opts
     */
    addToolbarSelect(name: string, selectOptions: SelectOptions, opts?: ToolbarFieldDefOptions) {
        this.addToolbarFieldDef({ type: 'select', name, options: selectOptions, ...opts })
    }

    /**
     * Adds a select to the toolbar with the given options.
     * @param name the name of the select
     * @param type the type attribute of the input field
     * @param opts
     */
    addToolbarInput(name: string, type: ValuedInputType, opts?: ToolbarFieldDefOptions) {
        this.addToolbarFieldDef({ type, name, ...opts })
    }

    protected addToolbarFieldDef(def: ToolbarFieldDef) {
        this._toolbarFieldsOrder.push(def.name)
        this._toolbarFields[def.name] = def
    }

    /// Rendering

    protected get toolbarClasses() : string[] {
        return []
    }

    render(parent: PartTag) {
        parent.div(`.tt-page-part.content-width-${this.mainContentWidth}`, page => {
            page.div('.tt-toolbar', toolbar => {
                toolbar.class(...this.toolbarClasses)
                this.renderCustomPreToolbar(toolbar)
                this.renderBreadcrumbs(toolbar)
                this.renderCustomToolbar(toolbar)
                if (this.hasToolbarFields) this.renderToolbarFields(toolbar)
                if (this.hasActions('tertiary')) this.renderActions(toolbar, 'tertiary')
            })

            page.div('.lighting')
            page.div('.full-width-page', conatiner => {
                conatiner.div('.page-content', main => {
                    this.renderContent(main)
                    main.div('.page-actions', actions => {
                        this.renderActions(actions, 'secondary', {iconColor: null, defaultClass: 'secondary'})
                        this.renderActions(actions, 'primary', {iconColor: null, defaultClass: 'primary'})
                    })
                })
            })
        })
    }

    protected renderActions(parent: PartTag, level: ActionLevel, options?: RenderActionOptions) {
        parent.div(`.${level}-actions`, actions => {
            this.app.theme.renderActions(actions, this.getActions(level), options)
        })
    }

    protected renderBreadcrumbs(parent: PartTag) {
        if (!this._breadcrumbs.length && !this._title?.length) return

        parent.h1('.breadcrumbs', h1 => {
            const crumbs = Array.from(this._breadcrumbs)

            // add a breadcrumb for the page title
            if (this._title?.length) {
                const titleCrumb: Action = {
                    title: this._title,
                    icon: this._icon || undefined,
                }
                if (this._titleHref) {
                    titleCrumb.href = this._titleHref
                }
                if (this._titleClasses?.length) {
                    titleCrumb.classes = this._titleClasses
                }
                crumbs.push(titleCrumb)
            }

            this.app.theme.renderActions(h1, crumbs)
        })
    }


    protected renderCustomPreToolbar(_parent: PartTag): void {

    }

    protected renderCustomToolbar(_parent: PartTag): void {

    }

    protected renderToolbarFields(parent: PartTag) {
        parent.div('.fields', fields => {
            for (const name of this._toolbarFieldsOrder) {
                const def = this._toolbarFields[name]
                if (!def) {
                    log.warn(`No select def with name ${name} could be found!`)
                    continue;
                }

                fields.label(label => {
                    if (def.icon?.length) {
                        label.i('.icon').class(def.icon)
                    }

                    if (def.title?.length) {
                        label.div('.title').text(def.title)
                    }

                    if (def.type === 'select') {
                        const select = label.select({name: def.name}, select => {
                            optionsForSelect(select, def.options, def.defaultValue)
                        })
                        if (def.onChangeKey) select.emitChange(def.onChangeKey)
                        if (def.onInputKey) select.emitInput(def.onInputKey)
                    } else {
                        const input = label.input({name: def.name, type: def.type, value: def.defaultValue})
                        if (def.type == 'checkbox' && def.defaultValue?.length) {
                            input.attrs({checked: def.defaultValue == 'true'})
                        }
                        if (def.onChangeKey) input.emitChange(def.onChangeKey)
                        if (def.onInputKey) input.emitInput(def.onInputKey)
                    }


                    if (def.tooltip?.length) label.dataAttr('tooltip', def.tooltip)
                })
            }
        })
    }
}