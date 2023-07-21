import {Query} from "./queries"
import {PartTag} from "tuff-core/parts"
import {FormFields} from "tuff-core/forms"
import {Logger} from "tuff-core/logging"
import {messages} from "tuff-core"
import ContentPart from "../../terrier/parts/content-part";

const log = new Logger("QueryForm")

export const QuerySettingsColumns = ['id', 'name', 'notes'] as const
export type QuerySettingsColumn = typeof QuerySettingsColumns[number]

export type QuerySettings = Pick<Query, QuerySettingsColumn>

export default class QueryForm extends ContentPart<{ query: QuerySettings }> {

    fields!: FormFields<QuerySettings>

    async init() {
        this.fields = new FormFields<QuerySettings>(this, this.state.query)
        this.listen('datachanged', this.fields.dataChangedKey, m => {
            log.info(`Query fields changed`, m.data)
            Object.assign(this.state.query, m.data)
            this.emitMessage(QueryForm.settingsChangedKey, m.data)
        }, {attach: 'passive'})
    }


    get parentClasses(): Array<string> {
        return ['tt-form', 'tt-flex', 'column', 'gap']
    }

    renderContent(parent: PartTag): void {
        parent.div('.tt-flex.gap', row => {
            row.div('.stretch', col => {
                col.label().text("Name")
                const nameField = this.fields.textInput(col, 'name')
                if (!this.state.query.name.length) {
                    nameField.class('error')
                }
            })
            row.div('.stretch', col => {
                col.label().text("Notes")
                this.fields.textArea(col, 'notes')
            })
        })
    }

    static readonly settingsChangedKey = messages.typedKey<QuerySettings>()

}