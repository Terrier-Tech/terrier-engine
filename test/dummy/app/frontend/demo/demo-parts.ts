import {NoState, PartTag} from "tuff-core/parts"
import DemoTheme, {ColorName, DemoThemeType} from "./demo-theme"
import {ModalPart, modalPopKey} from "@terrier/modals"
import {messages} from "tuff-core"
import Toasts from "@terrier/toasts";
import {ActionsDropdown} from "@terrier/dropdowns"
import {Action} from "@terrier/theme"
import DemoApp from "./demo-app";
import PanelPart from "@terrier/parts/panel-part"

const openModalKey = messages.untypedKey()
const toastKey = messages.typedKey<{color: ColorName}>()
const dropdownKey = messages.typedKey<{message: string}>()

type DemoAction = Action<DemoThemeType>

class Panel extends PanelPart<NoState, DemoThemeType, DemoApp, DemoTheme> {

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
            title: "Tertiary",
            classes: ['active']
        }, "tertiary")

        this.onClick(toastKey, m => {
            Toasts.show(`${m.data!!.color} toast`, {color: m.data!!.color}, this.theme)
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

class Modal extends ModalPart<NoState, DemoThemeType, DemoApp, DemoTheme> {

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


const DemoParts = {
    Panel,
    Modal,
    openModalKey
}

export default DemoParts