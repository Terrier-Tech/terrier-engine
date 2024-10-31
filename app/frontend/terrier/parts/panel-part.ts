import { DivTag, DivTagAttrs } from "tuff-core/html"
import { PartTag } from "tuff-core/parts"
import { TagArgs } from "tuff-core/tags"
import Fragments from "../fragments"
import CollapsiblePlugin, { CollapsibleOptions, CollapsibleState } from "../plugins/collapsible-plugin"
import ContentPart from "./content-part"

export type CollapsibleConfig = {
    collapsed?: boolean
    chevronSide?: 'left' | 'right'
}
/**
 * A part that renders content inside a panel.
 */
export default abstract class PanelPart<TState> extends ContentPart<TState & { collapsible?: CollapsibleConfig | CollapsibleOptions}> {
    collapsiblePlugin?: CollapsiblePlugin

    async init() {
        const collapsibleConfig = this.state.collapsible
        if (collapsibleConfig) {
            this.collapsiblePlugin = this.makePlugin(CollapsiblePlugin, { collapsibleState: this.getCollapsibleState(collapsibleConfig) })
        }
    }

    getCollapsibleState(collapsibleConfig: CollapsibleConfig | CollapsibleOptions): CollapsibleState {
        if ('collapsibleState' in collapsibleConfig && collapsibleConfig.collapsibleState) {
            return collapsibleConfig.collapsibleState
        } else if ('collapsed' in collapsibleConfig) {
            return collapsibleConfig.collapsed ? 'collapsed' : 'expanded'
        } else {
            return 'expanded'
        }
    }

    assignState(state: TState & { collapsible?: CollapsibleConfig | CollapsibleOptions }): boolean {
        if (state.collapsible) {
            const collapsibleState = this.getCollapsibleState(state.collapsible)
            if (this.collapsiblePlugin) {
                this.collapsiblePlugin.assignState({...this.collapsiblePlugin.state, collapsibleState})
            } else {
                this.collapsiblePlugin = this.makePlugin(CollapsiblePlugin, {collapsibleState})
            }
        }
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
            if (this._title?.length || this.hasActions('tertiary')) {
                panel.div('.panel-header', header => {
                    if (collapsibleConfig && (!('chevronSide' in collapsibleConfig) || collapsibleConfig?.chevronSide == 'left')) {
                        this.collapsiblePlugin!.renderCollapser(header, collapser => {
                            this.renderChevronIcon(collapser, this.collapsiblePlugin!.state.collapsibleState!)
                        })
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

                    if (collapsibleConfig && ('chevronSide' in collapsibleConfig) && collapsibleConfig?.chevronSide == 'right') {
                        this.collapsiblePlugin!.renderCollapser(header, collapser => {
                            this.renderChevronIcon(collapser, this.collapsiblePlugin!.state.collapsibleState!)
                        })
                    }
                })
            }

            this.renderPanelContent(panel, wrapper => {
                wrapper.class('panel-content', ...this.contentClasses)
                wrapper.div('.content-container', container => {
                    this.renderContent(container)
                })
            })

            Fragments.panelActions(panel, this.getAllActions(), this.theme)
        })
    }

    renderPanelContent(parent: PartTag, ...args: TagArgs<DivTag,DivTagAttrs>[]): DivTag {
        if (this.collapsiblePlugin) {
            return this.collapsiblePlugin.renderContainer(parent, collapsibleWrapper => {
                collapsibleWrapper.div(...args)
            })
        } else {
            return parent.div(...args)
        }
    }

    renderChevronIcon(parent: PartTag, _collapsibleState: CollapsibleState) {
        this.app.theme.renderIcon(parent, 'glyp-chevron_down', null)
    }
}