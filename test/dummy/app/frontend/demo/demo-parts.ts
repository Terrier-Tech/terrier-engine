import {PanelPart} from "@terrier/parts"
import {NoState, PartTag} from "tuff-core/parts"
import {ColorName, DemoThemeType} from "./demo-theme"
import {ModalPart, modalPopKey} from "@terrier/modals"
import {messages} from "tuff-core"
import Toasts from "@terrier/toasts";
import {ActionsDropdown} from "@terrier/dropdowns"
import {Action} from "@terrier/theme"

const openModalKey = messages.untypedKey()
const toastKey = messages.typedKey<{color: ColorName}>()
const dropdownKey = messages.typedKey<{message: string}>()

type DemoAction = Action<DemoThemeType>

class Panel extends PanelPart<NoState, DemoThemeType> {

    async init() {
        this.setTitle("Panel Header")

        this.addAction({
            title: "Dropdown",
            click: {key: dropdownKey, data: {message: "Simple Dropdown"}}
        }, "primary")

        this.addAction({
            title: "Toast",
            classes: ['secondary'],
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
        parent.p({text: "Padded panel content"})
            .data({tooltip: "This is a tooltip"})
    }

}

class Modal extends ModalPart<NoState, DemoThemeType> {

    async init() {
        this.setTitle("Modal Header")

        this.addAction({
            title: "Push",
            click: {key: openModalKey}
        }, "primary")

        this.addAction({
            title: "Pop",
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