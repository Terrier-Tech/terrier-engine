import TerrierPart from "../../terrier/parts/terrier-part"
import {FormFields} from "tuff-core/forms"
import {Logger} from "tuff-core/logging"
import {messages} from "tuff-core"
import {PartTag} from "tuff-core/parts"
import {DdDive, DdDiveEnumFields, DdDiveGroup, UnpersistedDdDive} from "../gen/models"
import inflection from "inflection"
import {SchemaDef} from "../../terrier/schema";
import {ModalPart} from "../../terrier/modals";
import {Query, QueryModelPicker} from "../queries/queries";
import Ids from "../../terrier/ids";
import Db from "../dd-db";
import {routes} from "../dd-routes";
import Nav from "tuff-core/nav";
import {DbErrors} from "../../terrier/db-client";

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


////////////////////////////////////////////////////////////////////////////////
// Dive Settings Modal
////////////////////////////////////////////////////////////////////////////////

type DiveSettingsState = {
    schema: SchemaDef
    groups: DdDiveGroup[]
    dive: UnpersistedDdDive
}

export class DiveSettingsModal extends ModalPart<DiveSettingsState> {

    settingsForm!: DiveForm
    modelPicker!: QueryModelPicker
    saveKey = messages.untypedKey()
    isNew = true
    errors?: DbErrors<UnpersistedDdDive>

    async init() {
        this.isNew = !this.state.dive.id?.length

        this.settingsForm = this.makePart(DiveForm, {
            dive: this.state.dive, groups: this.state.groups
        })
        this.modelPicker = this.makePart(QueryModelPicker, {schema: this.state.schema})

        if (this.isNew) {
            this.setTitle("New Dive")
        }
        else {
            this.setTitle("Edit Dive")
        }
        this.setIcon('glyp-data_dive')

        this.addAction({
            title: "Save",
            icon: 'glyp-checkmark',
            click: {key: this.saveKey}
        })

        this.onClick(this.saveKey, async _ => {
            const dive = {...this.state.dive}

            // settings
            const settings = await this.settingsForm.serialize()
            Object.assign(dive, settings)
            if (!settings.name?.length) {
                this.showToast("Please enter a dive name", {color: 'alert'})
                this.dirty()
                return
            }

            // model (for new dives only)
            if (this.isNew) {
                const model = this.modelPicker.model
                if (!model) {
                    this.showToast("Please select a model", {color: 'alert'})
                    return
                }
                const query: Query = {
                    id: Ids.makeUuid(),
                    name: settings.name,
                    notes: '',
                    from: {model: model.name}
                }
                dive.query_data = {queries: [query]}
                log.info(`Creating new dive ${dive.name}!`, dive)
            }
            else {
                log.info(`Updating existing dive ${dive.name}`, dive)
            }

            // upsert
            const res = await Db().upsert('dd_dive', dive)
            log.info(`Dive upsert response ${res.status}`, res)
            if (res.status == 'success') {
                this.pop()

                // if it's a new dive, go straight to the editor
                if (this.isNew) {
                    this.app.successToast(`Created Dive ${dive.name}`)
                    Nav.visit(routes.editor.path({id: res.record!.id}))
                }
                else {
                    // otherwise just reload the list
                    this.app.successToast(`Updated Dive ${dive.name}`)
                    Nav.visit(routes.list.path({}))
                }
            } else {
                this.app.alertToast(res.message)
                this.errors = res.errors
            }
        })
    }

    renderContent(parent: PartTag): void {
        parent.div('.tt-flex.tt-form.padded.column.gap.dd-new-dive-form', col => {
            if (this.errors) {
                this.renderErrorBubble(col, this.errors)
            }
            col.part(this.settingsForm)
            if (this.isNew) {
                col.part(this.modelPicker)
            }
        })
    }

}

