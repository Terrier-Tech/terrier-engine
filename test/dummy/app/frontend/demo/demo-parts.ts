import {NoState, PartTag} from "tuff-core/parts"
import {ModalPart, modalPopKey} from "@terrier/modals"
import Toasts from "@terrier/toasts"
import {ActionsDropdown} from "@terrier/dropdowns"
import {Action, ColorName} from "@terrier/theme"
import PanelPart from "@terrier/parts/panel-part"
import Tabs, {TabContainerPart} from "@terrier/tabs"
import {Logger} from "tuff-core/logging"
import Api from "@terrier/api"
import {ApiSubscriber, PollingSubscriber, StreamingSubscriber} from "@terrier/api-subscriber"
import Messages from "tuff-core/messages"
import Strings from "tuff-core/strings"
import {LogEntry} from "@terrier/logging"
import MultiCircularProgressBarPart, {MultiCircularProgressState} from "@terrier/multi-circular-progress";
import Time from "tuff-core/time"
import Hints from "@terrier/hints"
import TerrierPart from "@terrier/parts/terrier-part"
import LoadOnScrollPlugin, {LoadOnScrollOptions} from "@terrier/plugins/load-on-scroll-plugin";

const log = new Logger("Demo Parts")

const openModalKey = Messages.untypedKey()
const openLoadOnScrollKey = Messages.untypedKey()
const toastKey = Messages.typedKey<{color: ColorName}>()
const dropdownKey = Messages.typedKey<{message: string}>()
const streamingKey = Messages.untypedKey()
const subscriptionDropdownKey = Messages.untypedKey()
const subscriptionModalKey = Messages.typedKey<{ subType: 'polling' | 'streaming' }>()
const sheetKey = Messages.typedKey<{type: 'confirm'}>()


class Panel extends PanelPart<NoState> {

    async init() {
        this.setTitle("Panel Header ")

        this.addAction({
            title: 'Streaming',
            icon: 'glyp-download',
            click: {key: streamingKey}
        })

        this.addAction({
            title: "Subscription",
            icon: 'glyp-recent',
            click: {key: subscriptionDropdownKey},
            hint: {
                hint: {
                    title: "Action Hint",
                    tooltip: "This hint belongs on a panel action. " +
                        "Action hints can go on any kind of action that gets rendered with <code>Theme#renderActions</code>, " +
                        "Including panels, pages, and modals."
                },
                options: { side: 'bottom' }
            }
        })

        this.addAction({
            title: "Load on Scroll",
            icon: 'glyp-align_horizontal',
            click: {key: openLoadOnScrollKey},
        })

        this.addAction({
            title: "Dropdown",
            icon: 'glyp-click',
            click: {key: dropdownKey, data: {message: "Simple Dropdown"}}
        }, "secondary")

        this.addAction({
            title: "Toast",
            classes: ['secondary'],
            icon: 'glyp-announcement',
            click: {key: toastKey, data: {color: 'secondary'}}
        }, "secondary")

        this.addAction({
            icon: 'glyp-camera',
            classes: ['active'],
            tooltip: "Icon-Only"
        }, "tertiary")

        this.addAction({
            title: "Confirm Sheet",
            icon: 'glyp-help',
            classes: ['active'],
            click: {key: sheetKey, data: {type: 'confirm'}}
        }, "tertiary")

        this.onClick(toastKey, m => {
            Toasts.show(`${m.data!!.color} toast`, {color: m.data!!.color}, this.theme)
        })

        this.onClick(sheetKey, m => {
            log.info(`Showing ${m.data?.type} sheet`)
            switch (m.data?.type) {
                case 'confirm':
                    this.app.confirm({
                        title: "Are you sure?",
                        icon: 'glyp-help',
                        body: "Are you sure you want to do a thing?"
                    }, () => {
                        this.app.alert({
                            title: "Success!",
                            icon: 'glyp-complete',
                            body: "Okay, sounds good!"
                        })
                    })
            }
        })

        const dropdownActions: Array<Action> = [
            {title: "Action 1"},
            {title: "Action 2"},
            {title: "Action 3"},
            {title: "Action 4"},
        ]
        this.onClick(dropdownKey, m => {
            this.toggleDropdown(ActionsDropdown, dropdownActions, m.event.target)
        })

        this.onClick(streamingKey, _ => {
            this.app.showModal(StreamingModal, {})
        })

        this.onClick(subscriptionDropdownKey, m => {
            const subscriptionOptions = [
                { title: "Polling", click: { key: subscriptionModalKey, data: { subType: 'polling' } } },
                { title: "Streaming", click: { key: subscriptionModalKey, data: { subType: 'streaming' } } },
            ]
            this.toggleDropdown(ActionsDropdown, subscriptionOptions, m.event.target)
        })

        this.onClick(subscriptionModalKey, m => {
            let subscriber: ApiSubscriber<TimeResult, {}>
            if (m.data.subType == 'polling') {
                subscriber = new PollingSubscriber('/frontend/time', 1000, {})
            } else if (m.data.subType == 'streaming') {
                subscriber = new StreamingSubscriber('/frontend/stream_time', {})
            } else {
                throw new Error(`Unknown subscriber type ${m.data.subType}`)
            }

            this.app.showModal(SubscriptionModal, { subscriber })
        })

        this.onClick(openLoadOnScrollKey, _ => {
            this.app.showModal(LoadOnScrollDemoModal, {})
        })
    }

    protected get panelClasses(): string[] {
        return []
    }

    renderContent(parent: PartTag) {
        parent.div('.tt-flex.tablet-collapsible.padded', row => {
            row.div('.stretch', col => {
                col.p({text: "Stretch Column"})
                    .data({tooltip: "This is a tooltip"})
            })
            row.div('.shrink', col => {
                col.p({text: "Shrink Column"})
            })
        })
    }

}

class Modal extends ModalPart<NoState> {

    async init() {
        this.setTitle("Modal Header")

        this.addAction({
            title: "Push",
            icon: 'glyp-arrow_right',
            click: {key: openModalKey},
            hint: {
                hint: { title: "Modal Action Hint!" },
                options: { side: 'left' },
            }
        }, "primary")

        this.addAction({
            title: "Pop",
            icon: 'glyp-arrow_left',
            classes: ['secondary'],
            click: {key: modalPopKey}
        }, "secondary")
    }

    renderContent(parent: PartTag): void {
        parent.p({text: "Modal Content"})
    }

}


class DummyTab extends TerrierPart<{container: DemoTabs, title: string, content: string }> {


    get parentClasses(): Array<string> {
        return ['tt-flex', 'gap', 'column']
    }

    render(parent: PartTag) {
        parent.h2({text: this.state.title}, heading => {
            Hints.renderHint(this.theme, heading, { title: "Hint!", tooltip: "This is a tooltip for the tab heading! This one is rendered inline." })
        })
        for (const text of this.state.content.split("\n")) {
            parent.p({text})
        }
        parent.div('.tt-flex', row => {
            row.div().text("Tab Side:")
            for (const side of Tabs.Sides) {
                row.label(label => {
                    const checked = this.state.container.state.side == side
                    label.input({type: 'radio', name: 'tab-side', value: side, checked})
                        .emitChange(this.state.container.changeSideKey, {side})
                    label.span().text(Strings.titleize(side))
                })
            }
        })
    }
}

class DemoTabs extends TabContainerPart {
    async init() {
        await super.init()
        this.upsertTab(
            {key: 'one', title: "Tab One", icon: 'glyp-active'},
            DummyTab, {container: this, title: "Tab One", content: "This is the first tab."}
        )
        this.upsertTab(
            {key: 'two', title: "Tab Two", icon: 'glyp-complete'},
            DummyTab, {
                container: this, title: "Tab Two", content: "This is the second tab.\nIt takes up more space than the first one!"}
        )
        this.upsertTab(
            {key: 'three', title: "Tab Three", icon: 'glyp-pending', state: "disabled"},
            DummyTab, {container: this, title: "Tab Three", content: "This is the third tab."}
        )
        this.addBeforeAction({title: "Before", icon: 'hub-arrow_left'})
        this.addAfterAction({title: "After", icon: 'hub-arrow_right'})
    }
}


type FooEvent = {
    foo: string
    time: string
}

class StreamingModal extends ModalPart<NoState> {

    latestFoo?: FooEvent

    async init() {
        this.setTitle("Streaming")
        this.setIcon('glyp-download')

        Api.stream("/frontend/streaming")
            .on<FooEvent>('foo', evt => {
                this.latestFoo = evt
                this.dirty()
            })
            .onLog(evt => {
                log.info(`${evt.level} log event: ${evt.message}`)
            })
    }

    renderContent(parent: PartTag): void {
        parent.div('.tt-flex.column.padded.gap', col => {
            col.h3('.text-center', h3 => {
                if (this.latestFoo) {
                    const foo = this.latestFoo
                    h3.text(`foo <strong>${foo.foo}</strong> at ${foo.time}`)
                }
                else {
                    h3.text("Waiting for response...")
                }
            })
        })
    }

}

type TimeResult = { time: string }

class SubscriptionModal extends ModalPart<{ subscriber: ApiSubscriber<TimeResult, {}> }> {

    logger = new Logger("SubscriptionModal")

    logs: LogEntry[] = []
    results: TimeResult[] = []

    async init() {
        this.setTitle("Subscription")
        this.setIcon('glyp-recent')

        this.logger.level = 'debug'

        this.state.subscriber
            .on<FooEvent>('foo', fooEvent => {
                this.logger.info("A foo happened!", fooEvent)
            })
            .onResult(result => {
                this.results.push(result)
                this.logger.debug("Got result event!", result)
                this.dirty()
                return true
            })
            .onError(error => {
                this.logger.error("Got error event!", error)
                return true
            })
            .onLog(log => {
                this.logs.push(log)
                this.logger.debug("Got log event!", log)
                this.dirty()
            })
            .onUnsubscribe(() => {
                this.logger.debug("Unsubscribed from subscriber because the modal is closing probably")
            })
            .subscribe()
    }

    renderContent(parent: PartTag): void {
        parent.div('.tt-flex.gap.padded', row => {
            row.div('.stretch.tt-flex.column', col => {
                for (const log of this.logs) {
                    col.div(logLine => {
                        logLine.span(log.level, { text: log.level })
                        logLine.span({ text: log.message })
                    })
                }
            })
            row.div('.stretch.tt-flex.column', col => {
                for (const result of this.results) {
                    col.div({ text: JSON.stringify(result) })
                }
            })
        })
    }

    onRemoved() {
        // When we're removed from the page, unsubscribe from the subscriber so
        // it doesn't keep going in the background
        this.state.subscriber.unsubscribe()
    }

}

class LoadOnScrollDemoModal extends ModalPart<{}> {
    latestElement!: number

    async init() {
        this.setTitle("Load on Scroll Demo")

        const initialElements = [0, 1, 2, 3, 4, 5, 6]
        this.latestElement = initialElements[initialElements.length - 1]

        this.assignCollection('element-collection', LoadOnScrollDemoElement, initialElements)

        const state: LoadOnScrollOptions<number> = {
            collectionName: 'element-collection',
            collectionPartType: LoadOnScrollDemoElement,
            loadNextState: (_) => this.loadNextElement(),
        }
        this.makePlugin(LoadOnScrollPlugin<number>, state)
    }

    renderContent(parent: PartTag): void {
        parent.div('.tt-flex.column.gap.padded', container => {
            container.h1('.latest-element').text(`Latest Element: ${this.latestElement}`)
            this.renderCollection(container, 'element-collection')
                .class('tt-flex', 'column', 'gap')
        })
    }

    update(elem: HTMLElement) {
        const heading = elem.querySelector('.latest-element')
        if (!heading) return
        heading.textContent = `Latest Element: ${this.latestElement}`
    }

    async loadNextElement(): Promise<number[] | undefined> {
        await Time.wait(100)
        return [++this.latestElement]
    }
}

class LoadOnScrollDemoElement extends TerrierPart<number> {

    get parentClasses() {
        return [...super.parentClasses, 'tt-panel', 'padded']
    }

    render(parent: PartTag) {
        parent.div().text(this.state.toString())
    }
}


class CircleProgressPanel extends PanelPart<NoState> {

    mouseEnterKey = Messages.typedKey<{ index: number }>()

    circles!: MultiCircularProgressBarPart[]

    async init() {
        this.setTitle("Circular Progress Demo")

        const states: MultiCircularProgressState[] = [
            { total: 100, progress: 25, options: { color: 'red', outerDiameter: '200px', thickness: '10%', backgroundColor: 'var(--tt-pending-color)' } },
            { total: 100, progress: 50, options: { color: 'green', outerDiameter: '185px', thickness: '20%', transitionDuration: '1s', transitionTimingFunction: 'linear' } },
            { total: 100, progress: 75, options: { color: 'blue', outerDiameter: '215px', thickness: '7px', transitionDuration: '500ms' } },
            { total: 100, progress: [15, 30, 15, 0, 5], options: { color: ['magenta', 'cyan', 'yellow', 'lime', 'orange'], outerDiameter: '200px', thickness: '20px', transitionDuration: '550ms', transitionTimingFunction: 'linear' } },
        ]

        this.circles = states.map(s => this.makePart(MultiCircularProgressBarPart, s))

        Time.wait(0).then(async () => {
            let increasing = true
            while (increasing) {
                await Time.wait(500)

                increasing = false

                for (let i = 0; i < this.circles.length; i++) {
                    const circle = this.circles[i]
                    if (typeof circle.state.progress == "number") {
                        if (circle.state.progress + 5 <= 100) {
                            circle.updateProgress(circle.state.progress + 5)
                            increasing = true
                        }
                    } else {
                        if (circle.state.progress.reduce((acc, next) => acc + next) + 5 <= 100) {
                            circle.updateProgress(circle.state.progress.map(n => n + 1) as [number, number, number, number, number])
                            increasing = true
                        }
                    }
                }
            }
        })
    }

    renderContent(parent: PartTag): void {
        parent.div('.padded.tt-flex.gap.shrink-items.justify-space-evenly.align-center', row => {
            const sides = ['top', 'right', 'bottom', 'left'] as const
            for (let i = 0; i < this.circles.length; i++) {
                row.div(div => {
                    div.part(this.circles[i])
                    const side = sides[i]
                    Hints.renderHint(this.theme, div, { title: Strings.titleize(side), tooltip: `A hint floating to the ${side} of it's parent!` }, { side })
                })
            }
        })
    }

}


const DemoParts = {
    Panel,
    Modal,
    DemoTabs,
    CircleProgressPanel,
    openModalKey,
}

export default DemoParts