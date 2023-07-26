import PanelPart from "./panel-part";
import {typedKey} from "tuff-core/messages";
import {PartTag} from "tuff-core/parts";
import Fragments from "../fragments";

/**
 * A part that renders content inside a collapsible panel
 */
export default abstract class CollapsiblePanelPart<TState> extends PanelPart<TState> {
    toggleCollapseKey = typedKey<{}>()
    private collapsed = false
    chevronSide: 'left' | 'right' = 'left'
    async init() {
        this.onClick(this.toggleCollapseKey, _ => {
            this.toggleCollapse()
        })
        await this.childInit()
    }

    abstract childInit(): Promise<void>

    renderChevron(parent: PartTag) {
        parent.div('.collapsible-chevron', chev => {
            if (this.collapsed) {
                this.app.theme.renderIcon(chev, `glyp-chevron_${this.chevronSide}`, 'white')
            }
            else {
                this.app.theme.renderIcon(chev, 'glyp-chevron_down', 'white')
            }
        })
    }

    render(parent: PartTag) {
        parent.div('.tt-panel', panel => {
            panel.class(...this.panelClasses)
            panel.div('.panel-header', header => {
                if (this.chevronSide == 'left') {
                    this.renderChevron(panel)
                }
                header.h2(h2 => {
                    if (this._icon) {
                        this.app.theme.renderIcon(h2, this._icon, 'white')
                    }
                    h2.div('.title')
                })
                if (this.chevronSide == 'right') {
                    this.renderChevron(panel)
                }

                header.div('.tertiary-actions', actions => {
                    this.theme.renderActions(actions, this.getActions('tertiary'))
                })
                header.emitClick(this.toggleCollapseKey, {})
            })
            if (!this.collapsed) {
                panel.div('.panel-content', ...this.contentClasses, content => {
                    this.renderContent(content)
                })
            }
            Fragments.panelActions(panel, this.getAllActions(), this.theme)
        })
    }

    toggleCollapse() {
        this.collapsed = !this.collapsed
        this.dirty()
    }
}