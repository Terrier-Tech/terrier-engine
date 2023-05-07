import {PanelPart} from "@terrier/parts"
import {NoState, PartTag} from "tuff-core/parts"
import {DemoThemeType} from "./demo-theme"
import {ModalPart, modalPopKey} from "@terrier/modals"
import {messages} from "tuff-core"

const openModalKey = messages.untypedKey()

class Panel extends PanelPart<NoState, DemoThemeType> {

    async init() {
        this.setTitle("Panel Header")

        this.addAction({
            title: "Primary"
        }, "primary")

        this.addAction({
            title: "Secondary",
            classes: ['secondary']
        }, "secondary")

        this.addAction({
            title: "Tertiary",
            classes: ['active']
        }, "tertiary")
    }

    protected get panelClasses(): string[] {
        return ['padded']
    }

    renderContent(parent: PartTag) {
        parent.p({text: "Padded panel content"})
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