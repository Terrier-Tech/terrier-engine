import {NoState, PartTag} from 'tuff-core/parts'
import {Location} from '../gen/models'
import Db from './db'
import {Logger} from "tuff-core/logging"
import DemoTheme, {DemoThemeType} from "./demo-theme"
import {TerrierApp} from "@terrier/app"
import DemoParts from "./demo-parts"
import PagePart from "@terrier/parts/page-part"


const log = new Logger('DemoApp')

class DemoPage extends PagePart<NoState, DemoThemeType, DemoApp, DemoTheme> {

    async init() {
        this.setIcon('glyp-checkmark')
        this.setTitle("Demo Page")
        this.addBreadcrumb({ icon: 'glyp-abacus', title: "A Breadcrumb" })

        this.makePart(DemoParts.Panel, {}, 'panel')
        this.makePart(DemoParts.DemoTabs, {side: 'top'}, 'tabs')

        this.addAction({
            title: "Primary",
            icon: 'glyp-checkmark'
        }, "primary")

        this.addAction({
            title: "Secondary",
            classes: ['secondary']
        }, "secondary")

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
        })
    }

}

export default class DemoApp extends TerrierApp<{theme: DemoTheme}, DemoThemeType, DemoApp, DemoTheme> {

    loc?: Location
    page!: DemoPage

    async init() {
        super.init()
        this.loc = await Db().query("location")
            .where({state: "Minnesota"})
            .includes({invoices: {}})
            .orderBy("created_at desc")
            .first()
        if (this.loc) {
            log.info(`Got location ${this.loc.number}`, this.loc)
        }

        this.page = this.makePart(DemoPage, {})

        this.dirty()
    }

    render(parent: PartTag): any {
        parent.div('.tt-demo.tt-typography.tt-form', container => {
            container.part(this.page)
        })
        parent.part(this.overlayPart)
    }

}