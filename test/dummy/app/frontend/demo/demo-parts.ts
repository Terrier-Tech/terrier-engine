import {NoState, Part, PartTag} from "tuff-core/parts"
import DemoTheme, {ColorName, DemoThemeType} from "./demo-theme"
import {ModalPart, modalPopKey} from "@terrier/modals"
import {messages, strings} from "tuff-core"
import Toasts from "@terrier/toasts";
import {ActionsDropdown} from "@terrier/dropdowns"
import {Action} from "@terrier/theme"
import DemoApp, {DemoAppState} from "./demo-app"
import PanelPart from "@terrier/parts/panel-part"
import Tabs, { TabContainerPart } from "@terrier/tabs"
import {Logger} from "tuff-core/logging"

const log = new Logger("Demo Parts")

const openModalKey = messages.untypedKey()
const toastKey = messages.typedKey<{color: ColorName}>()
const dropdownKey = messages.typedKey<{message: string}>()
const sheetKey = messages.typedKey<{type: 'confirm'}>()

type DemoAction = Action<DemoThemeType>

class Panel extends PanelPart<NoState, DemoAppState, DemoThemeType, DemoApp, DemoTheme> {

    async init() {
        this.setTitle("Panel Header ")

        this.addAction({
            title: "Dropdown",
            click: {key: dropdownKey, data: {message: "Simple Dropdown"}}
        }, "primary")

        this.addAction({
            title: "Toast",
            classes: ['secondary'],
            icon: 'glyp-announcement',
            click: {key: toastKey, data: {color: 'secondary'}}
        }, "secondary")

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

        const dropdownActions: Array<DemoAction> = [
            {title: "Action 1"},
            {title: "Action 2"},
            {title: "Action 3"},
            {title: "Action 4"},
        ]
        this.onClick(dropdownKey, m => {
            this.toggleDropdown(ActionsDropdown, dropdownActions, m.event.target)
        })
    }

    protected get panelClasses(): string[] {
        return ['padded']
    }

    renderContent(parent: PartTag) {
        parent.div('.tt-flex.tablet-collapsible', row => {
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

class Modal extends ModalPart<NoState, DemoAppState, DemoThemeType, DemoApp, DemoTheme> {

    async init() {
        this.setTitle("Modal Header")

        this.addAction({
            title: "Push",
            icon: 'glyp-arrow_right',
            click: {key: openModalKey}
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


class DummyTab extends Part<{container: DemoTabs, title: string, content: string }> {


    get parentClasses(): Array<string> {
        return ['tt-flex', 'gap', 'column']
    }

    render(parent: PartTag) {
        parent.h2({text: this.state.title})
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
                    label.span().text(strings.titleize(side))
                })
            }
        })
    }
}

class DemoTabs extends TabContainerPart<DemoAppState, DemoThemeType, DemoApp, DemoTheme> {
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
        this.setBeforeAction({title: "Before", icon: 'glyp-info'})
        this.setAfterAction({title: "After", icon: 'glyp-plus'})
    }
}


const DemoParts = {
    Panel,
    Modal,
    DemoTabs,
    openModalKey
}

export default DemoParts