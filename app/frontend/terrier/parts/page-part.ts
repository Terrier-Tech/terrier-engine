import Theme, {Action, RenderActionOptions, ThemeType} from "../theme"
import {TerrierApp} from "../app"
import ContentPart, {ActionLevel} from "./content-part"
import {PartTag} from "tuff-core/parts"


/**
 * Whether some content should be constrained to a reasonable width or span the entire screen.
 */
export type ContentWidth = "normal" | "wide"

/**
 * A part that renders content to a full page.
 */
export default abstract class PagePart<
    TState,
    TThemeType extends ThemeType,
    TApp extends TerrierApp<TThemeType, TApp, TTheme>,
    TTheme extends Theme<TThemeType>
> extends ContentPart<TState, TThemeType, TApp, TTheme> {

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

            this.app.theme.renderActions(h1, crumbs)
        })
    }
}