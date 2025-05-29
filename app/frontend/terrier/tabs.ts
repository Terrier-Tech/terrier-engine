import { Logger } from "tuff-core/logging"
import Messages from "tuff-core/messages"
import { Part, PartParent, PartTag, StatelessPart } from "tuff-core/parts"
import TerrierPart from "./parts/terrier-part"
import { Action, IconName, Packet } from "./theme"
import SortablePlugin from "tuff-sortable/sortable-plugin"

const log = new Logger("Tabs")

/**
 * Parameters used for initial tab creation
 */
export type TabParams = {
    key: string
    title: string
    icon?: IconName
    state?: 'enabled' | 'disabled' | 'hidden'
    classes?: string[]
    click?: Packet
}

/**
 * Properties required to render a tab
 */
export type TabDefinition = TabParams & {
    part: Part<unknown>
}

const Sides = ['top', 'left', 'bottom', 'right'] as const

export type TabSide = typeof Sides[number]

export type TabContainerState = {
    side: TabSide
    reorderable?: boolean
    currentTab?: string
}

export class TabContainerPart extends TerrierPart<TabContainerState> {

    private tabs = new Map as Map<string, TabDefinition>
    private tabOrder = [] as string[]
    changeTabKey = Messages.typedKey<{ tabKey: string }>()
    changeSideKey = Messages.typedKey<{ side: TabSide }>()
    tabsModifiedKey = Messages.untypedKey()

    async init() {
        this.state = Object.assign({ reorderable: false }, this.state)

        this.onClick(this.changeTabKey, m => {
            log.info(`Clicked on tab ${m.data.tabKey}`)
            this.showTab(m.data.tabKey)
        })

        this.onChange(this.changeSideKey, m => {
            log.info(`Change tab side: ${m.data.side}`)
            this.state.side = m.data.side
            this.dirty()
        })

        if (this.state.reorderable) {
            this.makePlugin(SortablePlugin, {
                zoneClass: `tablist-${this.id}`,
                targetClass: 'tab',
                onSorted: () => {
                    // Get only our tab container, as other tab contains may exist inside this one.
                    const ourTabList = this.element?.getElementsByClassName(`tablist-${this.id}`)[0]
                    const tabElements = Array.from(ourTabList?.getElementsByClassName('tab') || []) as HTMLElement[]
                    this.tabOrder = tabElements.map(tabElement => tabElement.dataset?.key!)
                    this.#onTabsModified()
                    this.dirty()
                }
            })
        }
    }

    #onTabsModified() {
        this.emitMessage(this.tabsModifiedKey, null)
    }

    /**
     * Gets the current tab order as an array of keys.
     */
    getTabOrder = () => [...this.tabOrder]

    /**
     * Adds or overwrites an existing tab.
     * @param tab initial parameters for the tab
     * @param constructor constructor for the part that will make up the contents of the tab
     * @param state initial state for the content part
     */
    upsertTab<PartType extends Part<PartStateType>, PartStateType, InferredPartStateType extends PartStateType>(
        tab: TabParams,
        constructor: { new(p: PartParent, id: string, state: PartStateType): PartType; },
        state: InferredPartStateType
    ): PartType {
        const existingTab = this.tabs.get(tab.key) ?? {}
        const part = this.makePart(constructor, state)
        this.tabs.set(tab.key, Object.assign(existingTab, {
            state: 'enabled',
            part
        }, tab))
        if (!this.tabOrder.includes(tab.key))
            this.tabOrder.push(tab.key)
        this.#onTabsModified()
        this.dirty()
        return part
    }

    /**
     * Updates an existing tab with the given params
     * @param tab
     */
    updateTab(tab: TabParams): void {
        const existingTab = this.tabs.get(tab.key)
        if (!existingTab) throw `Tab with key '${tab.key}' does not exist!`
        Object.assign(existingTab, tab)
        this.dirty()
    }

    /**
     * Removes the tab with the given key.
     * @param key
     */
    removeTab(key: string) {
        const tab = this.tabs.get(key)
        if (!tab) return log.warn(`No tab ${key} to remove!`)

        log.info(`Removing tab ${key}`, tab)
        this.tabs.delete(key)
        this.tabOrder.splice(this.tabOrder.indexOf(key), 1)
        this.removeChild(tab.part)
        this.#onTabsModified()
        this.state.currentTab = undefined
        this.dirty()
    }

    /**
     * Changes this tab container to show the tab with the given key
     * @param tabKey
     */
    showTab(tabKey: string) {
        if (!this.tabs.has(tabKey)) {
            throw `Unknown tab key ${tabKey}`
        }
        if (this.tabs.get(tabKey)?.state != 'enabled') return // tab exists but is not enabled
        if (this.state.currentTab === tabKey) return // tab is already selected

        this.state.currentTab = tabKey
        this.dirty()
    }

    /**
     * Gets the current tab key.
     */
    get currentTagKey(): string | undefined {
        return this.state.currentTab || this.tabOrder[0]
    }


    _beforeActions: Action[] = []

    addBeforeAction(action: Action) {
        this._beforeActions.push(action)
        this.dirty()
    }

    _afterActions: Action[] = []

    addAfterAction(action: Action) {
        this._afterActions.push(action)
        this.dirty()
    }

    render(parent: PartTag) {
        let currentTabKey = this.state.currentTab
        if (!currentTabKey) {
            log.debug("no current tab specified, selecting first enabled tab")
            currentTabKey = this.tabs.values().find(t => t.state == 'enabled')?.key
        }
        parent.div('tt-tab-container', this.state.side, container => {
            container.div('.tt-flex.tt-tab-list', tabList => {
                tabList.class(`tablist-${this.id}`)
                if (this._beforeActions.length) {
                    this.theme.renderActions(tabList, this._beforeActions, { defaultClass: 'action' })
                }
                for (const tabKey of this.tabOrder) {
                    const tab = this.tabs.get(tabKey)!
                    if (tab.state == 'hidden') continue

                    tabList.a('.tab', a => {
                        a.attrs({ draggable: this.state.reorderable })
                        a.data({ key: tab.key })
                        a.class(tab.state || 'enabled')
                        if (tab.key === currentTabKey) a.class('active')
                        if (tab.icon) this.theme.renderIcon(a, tab.icon)
                        a.span({ text: tab.title })
                        a.emitClick(this.changeTabKey, { tabKey: tab.key })
                        if (tab.click) a.emitClick(tab.click.key, tab.click.data || {})
                    })
                }
                if (this._afterActions.length) {
                    tabList.div('.spacer')
                    this.theme.renderActions(tabList, this._afterActions, { defaultClass: 'action' })
                }
            })

            if (currentTabKey) {
                const currentTab = this.tabs.get(currentTabKey)!
                container.div('.tt-tab-content', panel => {
                    if (currentTab.classes?.length) panel.class(...currentTab.classes)
                    panel.part(currentTab.part as StatelessPart)
                })
            }
        })
    }

}

const Tabs = {
    TabContainerPart,
    Sides
}

export default Tabs