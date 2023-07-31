import ContentPart from "./content-part"
import {PartTag} from "tuff-core/parts"
import Fragments from "../fragments"
import {untypedKey} from "tuff-core/messages";
type PanelState = {
    collapsed?: Boolean
    collapsible?: Boolean
    chevronSide?: string
}
/**
 * A part that renders content inside a panel.
 */
export default abstract class PanelPart<TState> extends ContentPart<TState> {

    toggleCollapseKey = typedKey<{}>()
    private collapsed = false
    private collapsible = false
    chevronSide: 'left' | 'right' = 'left'

    async init() {
        if ('collapsible' in this.state) {
            this.collapsible = true
        }
        this.onClick(this.toggleCollapseKey, _ => {
            this.toggleCollapse()
        })
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
                    if (this.chevronSide == 'left') {
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
                    if (this.chevronSide == 'right') {
                        this.renderChevron(header)
                    }
                })
            }
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

    renderChevron(parent: PartTag) {
        if (this.collapsible) {
            parent.div('.collapsible-chevron', chev => {
                if (this.collapsed) {
                    this.app.theme.renderIcon(chev, `glyp-chevron_right`, 'white')
                }
                else {
                    this.app.theme.renderIcon(chev, 'glyp-chevron_down', 'white')
                }
                chev.emitClick(this.toggleCollapseKey, {})
            })
        }
    }
}