import {Logger} from "tuff-core/logging"
import PagePart from "../../terrier/parts/page-part"
import {PartTag} from "tuff-core/parts"
import Schema, {SchemaDef} from "../../terrier/schema"
import {ModalPart} from "../../terrier/modals"
import {Query, QueryModelPicker} from "../queries/queries"
import {arrays, messages} from "tuff-core"
import DiveForm from "./dive-form"
import {DdDive, DdDiveGroup, UnpersistedDdDive} from "../gen/models"
import Db from "../dd-db"
import Ids from "../../terrier/ids"
import Turbolinks from "turbolinks"
import Dives, {DiveListResult} from "./dives"
import {GroupEditorModal} from "./group-editor"
import Fragments from "../../terrier/fragments";
import {IconName} from "../../terrier/theme";

const log = new Logger("DiveList")


////////////////////////////////////////////////////////////////////////////////
// List
////////////////////////////////////////////////////////////////////////////////

export class DiveListPage extends PagePart<{}> {

    newGroupKey = messages.untypedKey()
    newDiveKey = messages.typedKey<{group_id: string}>()
    result!: DiveListResult
    schema!: SchemaDef

    async init() {
        this.setTitle("Data Dive")
        this.setIcon('glyp-data_dives')

        this.schema = await Schema.get()

        this.addAction({
            title: "New Group",
            icon: 'glyp-plus_outline',
            click: {key: this.newGroupKey}
        }, 'tertiary')

        this.onClick(this.newGroupKey, _ => {
            log.info("Showing new dive group model")
            this.app.showModal(GroupEditorModal, {group_id: '', callback: _ => this.dirty()})
        })

        this.onClick(this.newDiveKey, m => {
            const groupId = m.data.group_id
            log.info(`Showing new dive modal for group ${groupId}`)
            this.app.showModal(NewDiveModal, {schema: this.schema, group_id: groupId})
        })

        this.result = await Dives.list()

        log.info("Loading data dive list", this.result)


        this.dirty()
    }

    renderContent(parent: PartTag): void {

        const groupedDives = arrays.groupBy(this.result.dives, 'dd_dive_group_id')

        parent.div('.dd-group-grid', grid => {
            for (const group of this.result.groups) {
                this.renderGroupPanel(grid, group, groupedDives[group.id] || [])
            }

            // ungrouped dives
            const ungrouped = this.result.dives.filter(d => !d.dd_dive_group_id)
            for (const dive of ungrouped) {
                parent.a('.dive.tt-flex.gap', {href: `/data_dive/editor?id=${dive.id}`}).text(dive.name)
            }
        })
    }

    renderGroupPanel(parent: PartTag, group: DdDiveGroup, dives: DdDive[]) {
        Fragments.panel(this.theme)
            .title(group.name)
            .icon((group.icon || 'glyp-help') as IconName)
            .classes('group', 'padded')
            .content(content => {
                for (const dive of arrays.sortBy(dives, 'name')) {
                    content.a('.dive.tt-flex.gap', {href: `/data_dive/editor?id=${dive.id}`})
                        .text(dive.name)
                }
            })
            .addAction({
                title: "New Dive",
                icon: 'glyp-data_dive',
                click: {key: this.newDiveKey, data: {group_id: group.id}}
            }, 'secondary')
            .render(parent)
    }

}


////////////////////////////////////////////////////////////////////////////////
// New Dive Modal
////////////////////////////////////////////////////////////////////////////////

type NewDiveState = {
    schema: SchemaDef
    group_id: string
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

