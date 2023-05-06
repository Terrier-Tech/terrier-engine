import {PanelPart} from "@terrier/parts"
import {NoState, PartTag} from "tuff-core/parts"
import {DemoThemeType} from "./demo-theme"


class PanelPanel extends PanelPart<NoState, DemoThemeType> {

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


const DemoPanels = {
    PanelPanel
}

export default DemoPanels