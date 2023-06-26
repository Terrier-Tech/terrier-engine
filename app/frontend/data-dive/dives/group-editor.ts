import {ModalPart} from "../../terrier/modals"
import TerrierPart from "../../terrier/parts/terrier-part"
import {DdDiveGroup, UnpersistedDdDiveGroup} from "../gen/models"
import Db from "../dd-db"
import {PartTag} from "tuff-core/parts"
import {FormFields} from "tuff-core/forms"
import {messages} from "tuff-core"
import {DbErrors} from "../../terrier/db-client";

class GroupForm extends TerrierPart<{ group: UnpersistedDdDiveGroup }> {

    fields!: FormFields<UnpersistedDdDiveGroup>
    errors?: DbErrors<UnpersistedDdDiveGroup>

    async init() {
        this.fields = new FormFields(this, this.state.group)
    }

    setErrors(errors: DbErrors<UnpersistedDdDiveGroup>) {
        this.errors = errors
        this.dirty()
    }

    get parentClasses(): Array<string> {
        return ['tt-form', 'tt-flex', 'column', 'gap', 'padded']
    }

    render(parent: PartTag): any {
        if (this.errors) {
            this.renderErrorBubble(parent, this.errors)
        }
        parent.div('.tt-flex.collapsible.gap', row => {
            row.div('.stretch', col => {
                col.label().text("Name")
                this.fields.textInput(col, 'name')
                // col.label().text("Types")
                // col.div('.tt-flex.gap', typeRow => {
                //     for (const type of DdDiveEnumFields.visibility)
                // })
            })
            row.div('.stretch', col => {
                col.label().text("Description")
                this.fields.textArea(col, 'description_raw')
            })
        })
    }

    async serialize(): Promise<UnpersistedDdDiveGroup> {
        return this.fields.serialize()
    }

}


export type GroupModalState = { group_id: string, callback: (group: DdDiveGroup) => any }

export class GroupEditorModal extends ModalPart<GroupModalState> {

    form!: GroupForm
    saveKey = messages.untypedKey()

    async init() {
        const group: UnpersistedDdDiveGroup = this.state.group_id?.length
            ? await Db().find('dd_dive_group', this.state.group_id)
            : {name: '', group_types: []}
        this.form = this.makePart(GroupForm, {group})

        this.setTitle(group.id?.length ? "Edit Group" : "New Group")
        this.setIcon('glyp-grouped')

        this.addAction({
            title: 'Save',
            icon: 'glyp-checkmark',
            click: {key: this.saveKey}
        })

        this.onClick(this.saveKey, _ => {
            this.save()
        })
    }

    renderContent(parent: PartTag): void {
        parent.part(this.form)
    }

    async save() {
        this.startLoading()
        const unpersistedGroup = await this.form.serialize()
        const res = await Db().upsert('dd_dive_group', unpersistedGroup)
        this.stopLoading()
        if (res.status == 'success') {
            this.state.callback(res.record)
            this.successToast(`Saved group ${res.record?.name}`)
            this.pop()
        }
        else {
            this.alertToast(`Error saving group: ${res.message}`)
            this.form.setErrors(res.errors)
        }
    }


}