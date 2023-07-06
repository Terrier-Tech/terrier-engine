import ContentPart from "./content-part"
import {PartTag} from "tuff-core/parts"
import Fragments from "../fragments"

/**
 * A part that renders content inside a panel.
 */
export default abstract class PanelPart<TState> extends ContentPart<TState> {

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
                    header.h2(h2 => {
                        if (this._icon) {
                            this.app.theme.renderIcon(h2, this._icon, 'link')
                        }
                        h2.div('.title', {text: this._title || 'Call setTitle()'})
                    })
                    header.div('.tertiary-actions', actions => {
                        this.theme.renderActions(actions, this.getActions('tertiary'))
                    })
                })
            }
            panel.div('.panel-content', ...this.contentClasses, content => {
                this.renderContent(content)
            })
            Fragments.panelActions(panel, this.getAllActions(), this.theme)
        })
    }
}