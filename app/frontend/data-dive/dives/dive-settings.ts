import TerrierPart from "../../terrier/parts/terrier-part"
import {Logger} from "tuff-core/logging"
import {PartTag} from "tuff-core/parts"
import { SheetInput } from "../../terrier/sheets"
import {DdDive, DdDiveEnumFields, UnpersistedDdDive} from "../gen/models"
import * as inflection from "inflection"
import {SchemaDef} from "../../terrier/schema"
import {ModalPart} from "../../terrier/modals"
import {Query, QueryModelPicker} from "../queries/queries"
import Ids from "../../terrier/ids"
import Db from "../dd-db"
import {routes} from "../dd-routes"
import Nav from "tuff-core/nav"
import {DbErrors} from "../../terrier/db-client"
import {TerrierFormFields} from "../../terrier/forms"
import DdSession from "../dd-session"
import Dives from "./dives";
import Messages from "tuff-core/messages"

const log = new Logger("DiveForm")

export const DiveSettingsColumns = ['name', 'description_raw', 'visibility', 'dd_dive_group_id'] as const
export type DiveSettingsColumn = typeof DiveSettingsColumns[number]

export type DiveSettings = Pick<DdDive, DiveSettingsColumn>

/**
 * A form for editing the basic properties of a dive.
 */
class DiveForm extends TerrierPart<{dive: DiveSettings, session: DdSession}> {

    fields!: TerrierFormFields<DiveSettings>

    async init() {
        this.fields = new TerrierFormFields<DiveSettings>(this, this.state.dive)
        this.listen('datachanged', this.fields.dataChangedKey, m => {
            log.info(`Query fields changed`, m.data)
            Object.assign(this.state.dive, m.data)
            this.emitMessage(DiveForm.settingsChangedKey, m.data)
        }, {attach: 'passive'})
    }

    static readonly settingsChangedKey = Messages.typedKey<DiveSettings>()


    get parentClasses(): Array<string> {
        return ['tt-flex', 'column', 'gap']
    }

    render(parent: PartTag): any {
        this.fields.renderErrorBubble(parent)
        parent.div('.tt-flex.gap.collapsible', row => {
            // name
            row.div('.tt-compound-field', field => {
                field.label().text("Name")
                this.fields.textInput(field, 'name')
            })

            // group
            row.div('.tt-compound-field.shrink', field => {
                field.label().text("Group")
                this.fields.select(field, 'dd_dive_group_id', this.state.session.groupOptions())
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

    /**
     * Sets the errors on the fields and re-renders the form.
     * @param errors
     */
    setErrors(errors: DbErrors<UnpersistedDdDive>) {
        this.fields.errors = errors
        this.dirty()
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
    session: DdSession
    dive: UnpersistedDdDive
}

export class DiveSettingsModal extends ModalPart<DiveSettingsState> {

    settingsForm!: DiveForm
    modelPicker!: QueryModelPicker
    saveKey = Messages.untypedKey()
    deleteKey = Messages.untypedKey()
    duplicateKey = Messages.untypedKey()
    isNew = true

    async init() {
        this.isNew = !this.state.dive.id?.length

        this.settingsForm = this.makePart(DiveForm, {
            dive: this.state.dive, session: this.state.session
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

        if (!this.isNew) {
            if (Dives.canDelete(this.state.dive, this.state.session)) {
                this.addAction({
                    title: 'Delete',
                    icon: 'glyp-delete',
                    classes: ['alert'],
                    click: {key: this.deleteKey}
                }, 'secondary')
            }

            this.addAction({
                title: 'Duplicate',
                icon: 'glyp-duplicate',
                click: {key: this.duplicateKey}
            }, 'secondary')
        }

        this.onClick(this.saveKey, async _ => {
            await this.save()
        })

        this.onClick(this.deleteKey, async _ => {
            this.app.confirm({title: 'Delete this dive?', body: "Are you sure you want to delete this dive?", icon: 'glyp-delete'}, () => {
                this.delete()
            })
        })

        this.onClick(this.duplicateKey, async _ => {
            const nameInput: SheetInput = {
                type: 'text',
                key: 'name',
                value: this.state.dive.name + ' (Copy)',
                label: "New Dive Name"
            }
            this.app.confirm({
                title: 'Duplicate this dive?',
                body: "Are you sure you want to duplicate this dive?",
                icon: 'glyp-duplicate',
                inputs: [nameInput]
            }, () => {
                this.duplicate(nameInput.value)
            })
        })
    }

    renderContent(parent: PartTag): void {
        parent.div('.tt-flex.tt-form.padded.column.gap.dd-new-dive-form', col => {
            col.part(this.settingsForm)
            if (this.isNew) {
                col.part(this.modelPicker)
            }
        })
    }

    async save() {
        const dive = {...this.state.dive}

        // settings
        const settings = await this.settingsForm.serialize()
        Object.assign(dive, settings)

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
        } else {
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
            } else {
                // otherwise just reload the list
                this.app.successToast(`Updated Dive ${dive.name}`)
                Nav.visit(routes.list.path({}))
            }
        } else {
            this.settingsForm.setErrors(res.errors)
        }
    }

    async delete() {
        const dive = {...this.state.dive}
        dive._state = 2
        const res = await Db().upsert('dd_dive', dive)
        if (res.status == 'success') {
            this.pop()
            this.successToast(`Deleted dive ${dive.name}`)
            Nav.visit(routes.list.path({}))
        } else {
            this.settingsForm.setErrors(res.errors)
        }
    }

    async duplicate(name: string) {
        const dive = {...this.state.dive, name}
        delete dive.id
        const res = await Db().upsert('dd_dive', dive)
        if (res.status == 'success') {
            this.pop()
            this.successToast(`Duplicated dive ${dive.name}`)
            Nav.visit(routes.list.path({}))
        } else {
            this.alertToast(`Error duplicating dive: ${res.message}`)
        }
    }

}

