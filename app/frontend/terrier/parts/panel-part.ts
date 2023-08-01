import ContentPart from "./content-part"
import {PartTag} from "tuff-core/parts"
import Fragments from "../fragments"
import {untypedKey} from "tuff-core/messages";

export type CollapsibleConfig = {
    collapsed?: Boolean
    chevronSide: string
}
/**
 * A part that renders content inside a panel.
 */
export default abstract class PanelPart<TState> extends ContentPart<TState & { collapsible?: CollapsibleConfig}> {

    toggleCollapseKey = untypedKey()

    async init() {
        if (this.state.collapsible && !this.state.collapsible.chevronSide) {
            this.state.collapsible.chevronSide = 'left'
            this.onClick(this.toggleCollapseKey, _ => {
                this.toggleCollapse()
            })
        }
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
        parent.div('.tt-panel', panel => {
            panel.class(...this.panelClasses)
            if (this._title?.length || this.hasActions('tertiary')) {
                panel.div('.panel-header', header => {
                    if (this.state.collapsible?.chevronSide == 'left') {
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
                    if (this.state.collapsible?.chevronSide == 'right') {
                        this.renderChevron(header)
                    }
                })
            }
            if (!this.state.collapsible?.collapsed) {
                panel.div('.panel-content', ...this.contentClasses, content => {
                    this.renderContent(content)
                })
            }

            Fragments.panelActions(panel, this.getAllActions(), this.theme)
        })
    }

    toggleCollapse() {
        if (this.state.collapsible) {
            this.state.collapsible.collapsed = !this.state.collapsible?.collapsed
            this.dirty()
        }
    }

    renderChevron(parent: PartTag) {
        if (this.state.collapsible) {
            parent.div('.collapsible-chevron', chev => {
                this.renderChevronIcon(chev, this.state.collapsible?.collapsed!)
                parent.emitClick(this.toggleCollapseKey)
            })
        }
    }

    renderChevronIcon(parent: PartTag, isCollapsed: Boolean) {
        this.app.theme.renderIcon(parent, isCollapsed ? 'glyp-chevron_right' : 'glyp-chevron_down', 'white')
    }
}