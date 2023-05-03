import {NoState, Part, PartTag} from 'tuff-core/parts'
import {Location} from '../gen/models'
import Db from './db'
import {Logger} from "tuff-core/logging"

const log = new Logger('TapDemoApp')

export default class TapDemoApp extends Part<NoState> {

    loc?: Location

    async init() {
        this.loc = await Db().query("location")
            .where({state: "Minnesota"})
            .includes({invoices: {}})
            .orderBy("created_at desc")
            .first()
        if (this.loc) {
            log.info(`Got location ${this.loc.number}`, this.loc)
        }

        this.dirty()
    }

    render(parent: PartTag) {
        parent.h1({text: `Terrier Application Platform`})
        parent.h2({text: `Demo App`})
        if (this.loc) {
            parent.p({text: `Location: ${this.loc.display_name}`})
        }
    }

}