import {PartTag} from 'tuff-core/parts'
import {Logger} from "tuff-core/logging"
import DemoParts from "./demo-parts"
import {DemoPage} from "./demo-app"
import Hints from "@terrier/hints"


const log = new Logger('DemoApp')

/**
 * A page demoing the common Terrier platform elements.
 */
export default class PlatformDemoPage extends DemoPage {

    async init() {
        await super.init()

        this.setIcon('glyp-checkmark')
        this.setTitle("Platform Demo")

        this.makePart(DemoParts.Panel, {}, 'panel')
        this.makePart(DemoParts.DemoTabs, {side: 'top'}, 'tabs')
        this.makePart(DemoParts.CircleProgressPanel, {}, 'circle-progress')

        this.addAction({
            title: "Primary",
            icon: 'glyp-checkmark'
        }, "primary")

        this.addAction({
            title: "Secondary",
            classes: ['secondary']
        }, "secondary")

        Hints.addHintToggle(this, 'demo')

        this.addAction({
            icon: 'glyp-open',
            title: "Open Modal",
            click: {key: DemoParts.openModalKey}
        }, "tertiary")

        this.onClick(DemoParts.openModalKey, m => {
            log.info("Open Modal", m)
            this.app.showModal(DemoParts.Modal, {})
            this.dirty()
        }, {attach: 'passive'})
    }

    renderContent(parent: PartTag): void {
        parent.div('.tt-flex.column.gap.padded', col => {
            col.part(this.namedChild('panel')!)
            col.part(this.namedChild('tabs')!)
            col.part(this.namedChild('circle-progress')!)
        })
    }

}