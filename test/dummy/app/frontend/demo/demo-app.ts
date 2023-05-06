import {NoState, PartTag} from 'tuff-core/parts'
import {Location} from '../gen/models'
import Db from './db'
import {Logger} from "tuff-core/logging"
import {DemoThemeType} from "./demo-theme"
import {TerrierApp} from "@terrier/app"
import DemoPanels from "./demo-panels";
import {PagePart} from "@terrier/parts";

const log = new Logger('DemoApp')

class DemoPage extends PagePart<NoState, DemoThemeType> {

    async init() {
        this.makePart(DemoPanels.PanelPanel, {}, 'panel')

        this.addAction({
            title: "Primary"
        }, "primary")

        this.addAction({
            title: "Secondary",
            classes: ['secondary']
        }, "secondary")

        this.addAction({
            title: "Tertiary"
        }, "tertiary")

        this.setTitle("Demo Page")
    }

    renderContent(parent: PartTag): void {
        parent.div('.tt-flex.column.gap', col => {
            col.part(this.namedChild('panel')!)
        })
    }

}

export default class DemoApp extends TerrierApp<DemoThemeType> {

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

    render(parent: PartTag) {
        parent.div('.tt-demo.tt-typography', container => {
            container.part(this.page)
        })
    }

}