import {DdContentPart} from "../dd-parts"
import {Query} from "./queries"
import {PartTag} from "tuff-core/parts"
import {FormFields} from "tuff-core/forms"
import {Logger} from "tuff-core/logging"

const log = new Logger("QueryForm")


export class QueryForm extends DdContentPart<{ query: Query }> {

    fields!: FormFields<Query>

    async init() {
        this.fields = new FormFields<Query>(this, this.state.query)
        this.listenMessage(this.fields.dataChangedKey, m => {
            log.info(`Query fields changed`, m.data)
        }, {attach: 'passive'})
    }


    get parentClasses(): Array<string> {
        return ['tt-form']
    }

    renderContent(parent: PartTag): void {
        parent.div('.tt-flex.gap', row => {
            row.div('.stretch', col => {
                col.label().text("Name")
                this.fields.textInput(col, 'name')
            })
            row.div('.stretch', col => {
                col.label().text("Notes")
                this.fields.textArea(col, 'notes')
            })
        })
    }

}