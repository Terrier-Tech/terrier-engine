import ContentPart from "./content-part"
import {PartTag} from "tuff-core/parts"
import Fragments from "../fragments"
import {untypedKey} from "tuff-core/messages";

export type CollapsibleConfig = {
    collapsed?: boolean
    chevronSide?: 'left' | 'right'
}
/**
 * A part that renders content inside a panel.
 */
export default abstract class PanelPart<TState> extends ContentPart<TState & { collapsible?: CollapsibleConfig}> {
    protected static readonly DEFAULT_CHEVRON_SIDE: 'left' | 'right' = 'left'

    toggleCollapseKey = untypedKey()

    private _prevCollapsedState?: boolean

    async init() {
        if (this.state.collapsible) {
            this._prevCollapsedState = this.state.collapsible.collapsed
            this.state.collapsible.chevronSide ??= PanelPart.DEFAULT_CHEVRON_SIDE
            this.onClick(this.toggleCollapseKey, _ => {
                this.toggleCollapse()
            })
        }
    }

    assignState(state: TState & { collapsible?: CollapsibleConfig }): boolean {
        this._prevCollapsedState = state.collapsible?.collapsed
        return super.assignState(state);
    }

    getLoadingContainer() {
        return this.element?.getElementsByClassName('tt-panel')[0]
    }

    protected get panelClasses(): string[] {
        return []
    }

    protected get contentClasses(): string[] {
        return []
    }

    render(parent: PartTag) {
        const collapsibleConfig = this.state.collapsible
        parent.div('.tt-panel', panel => {
            panel.class(...this.panelClasses)
            if (collapsibleConfig?.collapsed) panel.class('collapsed')
            if (this._title?.length || this.hasActions('tertiary')) {
                panel.div('.panel-header', header => {
                    if (collapsibleConfig?.chevronSide == 'left') {
                        this.renderChevron(header)
                    }
                    header.h2(h2 => {
                        if (this._icon) {
                            this.app.theme.renderIcon(h2, this._icon, 'link')
                        }
                        h2.div('.title', {text: this._title || 'Call setTitle()'})
                    })
                    header.div('.tertiary-actions', actions => {
                        this.theme.renderActions(actions, this.getActions('tertiary'))
                    })
                    if (collapsibleConfig?.chevronSide == 'right') {
                        this.renderChevron(header)
                    }
                })
            }
            panel.div('.panel-content', ...this.contentClasses, content => {
                content.div('.content-container', container => {
                    this.renderContent(container)
                })
            })

            Fragments.panelActions(panel, this.getAllActions(), this.theme)
        })
    }

    update(elem: HTMLElement) {
        const panel = elem.querySelector('.tt-panel')
        if (!(panel instanceof HTMLElement)) return
        this.transitionCollapsed(panel)
    }

    private transitionCollapsed(panelElem: HTMLElement) {
        const collapsibleConfig = this.state.collapsible
        if (!collapsibleConfig) return

        if (collapsibleConfig.collapsed == this._prevCollapsedState) return

        const content = panelElem.querySelector('.panel-content') as HTMLElement
        const contentContainer = content.querySelector('.content-container') as HTMLElement

        const height = `${contentContainer.clientHeight}px`
        if (collapsibleConfig.collapsed) {
            // we can't transition between 'auto' and a set pixel value,
            // so we need to first set to the initial pixel value (gotten from the content container,
            // whose height is not limited), then set to 0
            content.style.flexBasis = height
            requestAnimationFrame(() => {
                // ensure initial height has been set before continuing
                content.style.flexBasis = '0'
            })
        } else {
            content.style.flexBasis = height
        }

        panelElem.classList.toggle('collapsed', collapsibleConfig.collapsed)
    }

    toggleCollapse() {
        if (this.state.collapsible) {
            this._prevCollapsedState = this.state.collapsible.collapsed
            this.state.collapsible.collapsed = !this.state.collapsible.collapsed
            this.stale()
        }
    }

    renderChevron(parent: PartTag) {
        if (this.state.collapsible) {
            parent.a('.collapsible-chevron', chev => {
                this.renderChevronIcon(chev, this.state.collapsible?.collapsed!)
            }).emitClick(this.toggleCollapseKey)
        }
    }

    renderChevronIcon(parent: PartTag, _isCollapsed: Boolean) {
        this.app.theme.renderIcon(parent, 'glyp-chevron_down', 'white')
    }
}