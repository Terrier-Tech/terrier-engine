import TerrierPart from "../../terrier/parts/terrier-part"
import {FormFields} from "tuff-core/forms"
import {Logger} from "tuff-core/logging"
import {messages} from "tuff-core"
import {PartTag} from "tuff-core/parts"
import {DdDive} from "../gen/models"

const log = new Logger("DiveForm")

export const DiveSettingsColumns = ['name', 'description_raw'] as const
export type DiveSettingsColumn = typeof DiveSettingsColumns[number]

export type DiveSettings = Pick<DdDive, DiveSettingsColumn>

export default class DiveForm extends TerrierPart<{dive: DiveSettings}> {

    fields!: FormFields<DiveSettings>

    async init() {
        this.fields = new FormFields<DiveSettings>(this, this.state.dive)
        this.listen('datachanged', this.fields.dataChangedKey, m => {
            log.info(`Query fields changed`, m.data)
            Object.assign(this.state.dive, m.data)
            this.emitMessage(DiveForm.settingsChangedKey, m.data)
        }, {attach: 'passive'})
    }

    static readonly settingsChangedKey = messages.typedKey<DiveSettings>()

    render(parent: PartTag): any {
        parent.div('.tt-flex.gap', row => {
            row.div('.stretch', col => {
                col.label().text("Name")
                const nameField = this.fields.textInput(col, 'name')
                if (!this.state.dive.name.length) {
                    nameField.class('error')
                }
            })
            row.div('.stretch', col => {
                col.label().text("Description")
                this.fields.textArea(col, 'description_raw')
            })
        })
    }

    async serialize(): Promise<DiveSettings> {
        return await this.fields.serialize()
    }
}