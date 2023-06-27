import TerrierPart from "../../terrier/parts/terrier-part"
import {FormFields} from "tuff-core/forms"
import {Logger} from "tuff-core/logging"
import {messages} from "tuff-core"
import {PartTag} from "tuff-core/parts"
import {DdDive, DdDiveEnumFields, DdDiveGroup} from "../gen/models"
import inflection from "inflection"

const log = new Logger("DiveForm")

export const DiveSettingsColumns = ['name', 'description_raw', 'visibility', 'dd_dive_group_id'] as const
export type DiveSettingsColumn = typeof DiveSettingsColumns[number]

export type DiveSettings = Pick<DdDive, DiveSettingsColumn>

/**
 * A form for editing the basic properties of a dive.
 */
export default class DiveForm extends TerrierPart<{dive: DiveSettings, groups: DdDiveGroup[]}> {

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


    get parentClasses(): Array<string> {
        return ['tt-flex', 'column', 'gap']
    }

    render(parent: PartTag): any {
        parent.div('.tt-flex.gap.collapsible', row => {
            // name
            row.div('.tt-compound-field', field => {
                field.label().text("Name")
                const nameField = this.fields.textInput(field, 'name')
                if (!this.state.dive.name.length) {
                    nameField.class('error')
                }
            })

            // group
            row.div('.tt-compound-field.shrink', field => {
                field.label().text("Group")
                const groupOptions = this.state.groups.map(g => {
                    return {title: g.name, value: g.id}
                })
                this.fields.select(field, 'dd_dive_group_id', groupOptions)
            })
        })

        // description
        parent.div('.tt-compound-field', field => {
            field.label().text("Description")
            this.fields.textInput(field, 'description_raw')
        })

        // visibility radios
        parent.div('.tt-flex.gap.align-center.padded', row => {
            row.label('.caption-size').text("Visibility:")
            for (const v of DdDiveEnumFields.visibility) {
                row.label('.caption-size', label => {
                    this.fields.radio(label, 'visibility', v)
                    label.span().text(inflection.titleize(v))
                })
            }
        })
    }

    async serialize(): Promise<DiveSettings> {
        return await this.fields.serialize()
    }
}