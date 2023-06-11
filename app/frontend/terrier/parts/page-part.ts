import Theme, {Action, RenderActionOptions, ThemeType} from "../theme"
import {TerrierApp} from "../app"
import ContentPart, {ActionLevel} from "./content-part"
import {PartTag} from "tuff-core/parts"
import {optionsForSelect, SelectOptions} from "tuff-core/forms"
import {UntypedKey} from "tuff-core/messages"
import {Logger} from "tuff-core/logging"
import {HtmlParentTag} from "tuff-core/html"

const log = new Logger("Terrier PagePart")

/**
 * Whether some content should be constrained to a reasonable width or span the entire screen.
 */
export type ContentWidth = "normal" | "wide"

/// Toolbar fields

type BaseFieldDef = { name: string } & ToolbarFieldDefOptions

type ToolbarFieldDefOptions = {
    onChangeKey?: UntypedKey,
    onInputKey?: UntypedKey,
    defaultValue?: string,
    tooltip?: string
}

type ToolbarSelectDef = { type: 'select', options: SelectOptions } & BaseFieldDef

type ValuedInputType = 'text' | 'color' | 'date' | 'datetime-local' | 'email' | 'hidden' | 'month' | 'number' | 'password' | 'search' | 'tel' | 'time' | 'url' | 'week'
type ToolbarValuedInputDef = { type: ValuedInputType } & BaseFieldDef

/**
 * Defines a field to be rendered in the page's toolbar
 */
type ToolbarFieldDef = ToolbarSelectDef | ToolbarValuedInputDef

/**
 * A part that renders content to a full page.
 */
export default abstract class PagePart<
    TState,
    TThemeType extends ThemeType,
    TApp extends TerrierApp<any, TThemeType, TApp, TTheme>,
    TTheme extends Theme<TThemeType>
> extends ContentPart<TState, TThemeType, TApp, TTheme> {

    /// Content Width

    /**
     * Whether the main content should be constrained to a reasonable width (default) or span the entire screen.
     */
    protected mainContentWidth: ContentWidth = "normal"

    /// Breadcrumbs

    private _breadcrumbs = Array<Action<TThemeType>>()

    addBreadcrumb(crumb: Action<TThemeType>) {
        this._breadcrumbs.push(crumb)
    }

    private _titleHref?: string

    /**
     * Adds an href to the title (last) breadcrumb.
     * @param href
     */
    setTitleHref(href: string) {
        this._titleHref = href
    }

    /// Toolbar Fields

    private _toolbarFieldsOrder: string[] = []
    private _toolbarFields: Record<string, ToolbarFieldDef> = {}

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

    private addToolbarFieldDef(def: ToolbarFieldDef) {
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

    protected renderActions(parent: PartTag, level: ActionLevel, options?: RenderActionOptions<TThemeType>) {
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
                const titleCrumb: Action<TThemeType> = {
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

    protected renderCustomToolbar(_parent: PartTag): void {

    }

    protected renderToolbarFields(parent: PartTag) {
        parent.div('.fields.tt-flex.align-center.small-gap', fields => {
            for (const name of this._toolbarFieldsOrder) {
                const def = this._toolbarFields[name]
                if (!def) {
                    log.warn(`No select def with name ${name} could be found!`)
                    continue;
                }

                let field!: HtmlParentTag
                if (def.type === 'select') {
                    field = fields.select({name: def.name}, select => {
                        optionsForSelect(select, def.options, def.defaultValue)
                    })
                } else {
                    field = fields.input({name: def.name, type: def.type})
                }

                if (def.onChangeKey) field.emitChange(def.onChangeKey)
                if (def.onInputKey) field.emitInput(def.onInputKey)
                if (def.tooltip?.length) field.dataAttr('tooltip', def.tooltip)
            }
        })
    }
}