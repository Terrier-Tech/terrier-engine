import {Logger} from "tuff-core/logging"
import {typedKey} from "tuff-core/messages"
import {Part, PartParent, PartTag, StatelessPart} from "tuff-core/parts"
import TerrierPart from "./parts/terrier-part"
import Theme, {ThemeType} from "./theme"
import {TerrierApp} from "./app"

const log = new Logger("Tabs")

/**
 * Parameters used for initial tab creation
 */
export type TabParams<TT extends ThemeType> = {
    key: string
    title: string
    icon?: TT['icons']
    state?: 'enabled' | 'disabled' | 'hidden'
}

/**
 * Properties required to render a tab
 */
export type TabDefinition<TT extends ThemeType> = {
    key: string,
    title: string,
    icon?: TT['icons'],
    state: 'enabled' | 'disabled' | 'hidden',
    part: Part<unknown>
}

export type TabState = {currentTab? : string}

export default class TabContainerPart<
    TThemeType extends ThemeType,
    TApp extends TerrierApp<TThemeType, TApp, TTheme>,
    TTheme extends Theme<TThemeType>
> extends TerrierPart<TabState, TThemeType, TApp, TTheme> {

    private tabs = {} as Record<string, TabDefinition<TThemeType>>
    private tabClickKey = typedKey<{ tabKey: string }>()

    async init() {
        this.onClick(this.tabClickKey, m => {
            log.info(`Clicked on tab ${m.data.tabKey}`)
            this.showTab(m.data.tabKey)
        })
    }

    /**
     * Adds or overwrites an existing tab.
     * @param tab initial parameters for the tab
     * @param constructor constructor for the part that will make up the contents of the tab
     * @param state initial state for the content part
     */
    upsertTab<PartType extends Part<PartStateType>, PartStateType, InferredPartStateType extends PartStateType>(
        tab: TabParams<TThemeType>,
        constructor: { new(p: PartParent, id: string, state: PartStateType): PartType; },
        state: InferredPartStateType
    ): PartType {
        const existingTab = this.tabs[tab.key] ?? {}
        this.tabs[tab.key] = Object.assign(existingTab, {state: 'enabled'}, tab)
        const part = this.makePart(constructor, state)
        existingTab.part = part
        this.dirty()
        return part
    }

    /**
     * Updates an existing tab with the given params
     * @param tab
     */
    updateTab(tab: TabParams<TThemeType>): void {
        const existingTab = this.tabs[tab.key]
        if (!existingTab) throw `Tab with key '${tab.key}' does not exist!`
        Object.assign(existingTab, tab)
    }

    /**
     * Changes this tab container to show the tab with the given key
     * @param tabKey
     */
    showTab(tabKey: string) {
        if (!(tabKey in this.tabs)) {
            throw `Unknown tab key ${tabKey}`
        }
        if (this.tabs[tabKey].state != 'enabled') return // tab exists but is not enabled
        if (this.state.currentTab === tabKey) return // tab is already selected

        this.state.currentTab = tabKey
        this.dirty()
    }

    get parentClasses(): Array<string> {
        return ['tt-tab-container']
    }

    render(parent: PartTag) {
        let currentTabKey = this.state.currentTab
        if (!currentTabKey) {
            log.debug("no current tab specified, selecting first enabled tab")
            currentTabKey = Object.values(this.tabs).find(t => t.state == 'enabled')?.key
        }
        parent.div('.tt-flex.tt-tab-list', tabList => {
            for (const tab of Object.values(this.tabs)) {
                if (tab.state == 'hidden') continue

                tabList.a('.tab', a => {
                    a.class(tab.state)
                    if (tab.key === currentTabKey) {
                        a.class('active')
                    }
                    if (tab.icon) {
                        this.theme.renderIcon(a, tab.icon)
                    }
                    a.span({text: tab.title})
                    a.emitClick(this.tabClickKey, {tabKey: tab.key})
                })
            }
        })

        if (currentTabKey) {
            const currentTabPart = this.tabs[currentTabKey].part
            parent.div('.tt-panel.padded', panel => {
                panel.part(currentTabPart as StatelessPart)
            })
        }
    }

}