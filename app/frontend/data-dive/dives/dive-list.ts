import {Logger} from "tuff-core/logging"
import PagePart from "../../terrier/parts/page-part"
import {PartTag} from "tuff-core/parts"
import Schema, {SchemaDef} from "../../terrier/schema"
import {ModalPart} from "../../terrier/modals"
import {Query, QueryModelPicker} from "../queries/queries"
import {messages} from "tuff-core"
import DiveForm from "./dive-form"
import {UnpersistedDdDive} from "../gen/models"
import Db from "../dd-db"
import Ids from "../../terrier/ids"
import Turbolinks from "turbolinks"
import Dives, {DiveListResult} from "./dives"

const log = new Logger("DiveList")


////////////////////////////////////////////////////////////////////////////////
// List
////////////////////////////////////////////////////////////////////////////////

export class DiveListPage extends PagePart<{}> {

    newKey = messages.untypedKey()
    result!: DiveListResult

    async init() {
        this.setTitle("Data Dive")
        this.setIcon('glyp-data_dives')

        const schema = await Schema.get()

        this.addAction({
            title: "New Dive",
            icon: 'glyp-plus_outline',
            click: {key: this.newKey}
        }, 'tertiary')

        this.onClick(this.newKey, _ => {
            log.info("Showing new dive model")
            this.app.showModal(NewDiveModal, {schema})
        })

        this.result = await Dives.list()

        log.info("Loading data dive list", this.result)


        this.dirty()
    }

    renderContent(parent: PartTag): void {

        for (const dive of this.result.dives) {
            parent.a('.dive.tt-flex.gap', {href: `/data_dive/editor?id=${dive.id}`}).text(dive.name)
        }
    }

}


////////////////////////////////////////////////////////////////////////////////
// New Dive Modal
////////////////////////////////////////////////////////////////////////////////

type NewDiveState = {
    schema: SchemaDef
}

class NewDiveModal extends ModalPart<NewDiveState> {

    settingsForm!: DiveForm
    modelPicker!: QueryModelPicker
    createKey = messages.untypedKey()

    async init() {
        this.settingsForm = this.makePart(DiveForm, {dive: {name: '', description_raw: '', visibility: 'public'}})
        this.modelPicker = this.makePart(QueryModelPicker, {schema: this.state.schema})

        this.setTitle("New Dive")
        this.setIcon('glyp-data_dive')

        this.addAction({
            title: "Create",
            icon: 'glyp-checkmark',
            click: {key: this.createKey}
        })

        this.onClick(this.createKey, async _ => {
            const settings = await this.settingsForm.serialize()
            const model = this.modelPicker.model
            if (!settings.name?.length) {
                this.showToast("Please enter a query name", {color: 'alert'})
                this.dirty()
                return
            }
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
            log.info(`Creating new dive!`, settings)
            const dive: UnpersistedDdDive = {...settings, query_data: {
                    queries: [query]
                }}
            const res = await Db().insert('dd_dive', dive)
            if (res.status == 'success') {
                this.app.successToast(`Created Dive ${dive.name}`)
                this.pop()
                Turbolinks.visit(`/data_dive/editor?id=${res.record?.id}`)
            }
            else {
                this.app.alertToast(res.message)
            }
        })
    }

    renderContent(parent: PartTag): void {
        parent.div('.tt-flex.tt-form.padded.column.gap.dd-new-dive-form', col => {
            col.part(this.settingsForm)
            col.part(this.modelPicker)
        })
    }

}

