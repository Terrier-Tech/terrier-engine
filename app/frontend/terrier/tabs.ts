import { Logger } from "tuff-core/logging"
import Messages from "tuff-core/messages"
import { Part, PartParent, PartTag, StatelessPart } from "tuff-core/parts"
import TerrierPart from "./parts/terrier-part"
import { Action, ColorName, IconName, Packet } from "./theme"
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
    tabClasses?: string[]
    click?: Packet
    iconColor?: ColorName
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
                    this.dirty()
                }
            })
        }
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

    partialUpdateTab(tab: Partial<TabParams> & Pick<TabParams, 'key'>): void {
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
                if (this._beforeActions.length) {
                    this.theme.renderActions(tabList, this._beforeActions, { defaultClass: 'action' })
                }
                // The tabs live inside a scroll viewport/track so that they can be shifted
                // horizontally (for top/bottom sides) without moving the before/after actions.
                tabList.div('.tt-tab-scroll', scroll => {
                    scroll.div('.tt-tab-track', track => {
                        track.class(`tablist-${this.id}`)
                        for (const tabKey of this.tabOrder) {
                            const tab = this.tabs.get(tabKey)!
                            if (tab.state == 'hidden') continue

                            track.a('.tab', a => {
                                if (tab.tabClasses?.length) a.class(...tab.tabClasses)
                                a.attrs({ draggable: this.state.reorderable })
                                a.data({ key: tab.key })
                                a.class(tab.state || 'enabled')
                                if (tab.key === currentTabKey) a.class('active')
                                if (tab.icon) this.theme.renderIcon(a, tab.icon, tab.iconColor ? tab.iconColor : 'secondary')
                                a.span({ text: tab.title })
                                a.emitClick(this.changeTabKey, { tabKey: tab.key })
                                if (tab.click) a.emitClick(tab.click.key, tab.click.data || {})
                            })
                        }
                    })
                })
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

    private tabScrollObserver?: ResizeObserver

    update(elem: HTMLElement) {
        super.update(elem)
        this.layoutHorizontalTabs()
    }

    /**
     * For top/bottom tab containers, wires up the horizontal scroll behavior: keeps the selected
     * tab in view, translates vertical mouse-wheel gestures into horizontal scrolling, and keeps
     * the selected tab visible as the container is resized.
     */
    private layoutHorizontalTabs() {
        const container = this.element?.querySelector('.tt-tab-container')
        const isHorizontal = !!container && (container.classList.contains('top') || container.classList.contains('bottom'))
        if (!isHorizontal) {
            this.tabScrollObserver?.disconnect()
            this.tabScrollObserver = undefined
            return
        }

        const viewport = container!.querySelector('.tt-tab-scroll') as HTMLElement | null
        if (!viewport) return

        // The viewport is recreated on every full render, so the observer has to be re-pointed and
        // the wheel handler re-attached each time update() runs. The dataset flag prevents attaching
        // the listener more than once when the same element survives a stale update.
        if (!this.tabScrollObserver) {
            this.tabScrollObserver = new ResizeObserver(() => this.applyTabScrollOffset())
        }
        this.tabScrollObserver.disconnect()
        this.tabScrollObserver.observe(viewport)

        if (!viewport.dataset.wheelBound) {
            viewport.dataset.wheelBound = 'true'
            viewport.addEventListener('wheel', this.onTabWheel, { passive: false })
        }

        this.applyTabScrollOffset()
    }

    /**
     * Lets a plain (vertical) mouse wheel scroll the tabs horizontally, so users without a
     * trackpad can still scroll left and right. Only intercepts when the tabs actually overflow.
     */
    private onTabWheel = (e: WheelEvent) => {
        const viewport = e.currentTarget as HTMLElement
        if (viewport.scrollWidth <= viewport.clientWidth) return // nothing to scroll
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
        if (!delta) return
        viewport.scrollLeft += delta
        e.preventDefault()
    }

    /**
     * Scrolls the viewport so the selected tab sits near the left edge, offset slightly so the
     * preceding tab remains partially visible. Only scrolls when the tabs actually overflow their
     * container; otherwise they're left in place.
     */
    private applyTabScrollOffset() {
        const viewport = this.element?.querySelector('.tt-tab-scroll') as HTMLElement | null
        const track = this.element?.querySelector('.tt-tab-track') as HTMLElement | null
        if (!viewport || !track) return

        const active = track.querySelector('.tab.active') as HTMLElement | null
        const contentWidth = track.scrollWidth
        const viewportWidth = viewport.clientWidth

        // If all the tabs fit (or nothing's selected), don't move them.
        if (!active || contentWidth <= viewportWidth) {
            viewport.scrollLeft = 0
            return
        }

        // Line up the left edge of the viewport just before the active tab, leaving a sliver of the
        // preceding tab visible. Clamp so we never scroll past the last tab (no empty gap at the end).
        const prev = active.previousElementSibling as HTMLElement | null
        let offset = active.offsetLeft
        if (prev) {
            offset = prev.offsetLeft + prev.offsetWidth - Math.min(prev.offsetWidth, 32)
        }
        const maxOffset = contentWidth - viewportWidth
        viewport.scrollLeft = Math.max(0, Math.min(offset, maxOffset))
    }

}

const Tabs = {
    TabContainerPart,
    Sides
}

export default Tabs