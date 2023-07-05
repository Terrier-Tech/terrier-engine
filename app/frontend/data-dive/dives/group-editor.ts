import {ModalPart} from "../../terrier/modals"
import TerrierPart from "../../terrier/parts/terrier-part"
import {DdDiveGroup, UnpersistedDdDiveGroup} from "../gen/models"
import Db from "../dd-db"
import {PartTag} from "tuff-core/parts"
import {messages} from "tuff-core"
import {DbErrors} from "../../terrier/db-client"
import DdSession from "../dd-session"
import Nav from "tuff-core/nav"
import {routes} from "../dd-routes"
import {TerrierFormFields} from "../../terrier/forms"

class GroupForm extends TerrierPart<{ group: UnpersistedDdDiveGroup }> {

    fields!: TerrierFormFields<UnpersistedDdDiveGroup>

    async init() {
        this.fields = new TerrierFormFields(this, this.state.group)
    }

    setErrors(errors: DbErrors<UnpersistedDdDiveGroup>) {
        this.fields.errors = errors
        this.dirty()
    }

    get parentClasses(): Array<string> {
        return ['tt-form', 'tt-flex', 'column', 'gap', 'padded']
    }

    render(parent: PartTag): any {
        this.fields.renderErrorBubble(parent)
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


export type GroupModalState = {
    session: DdSession
    group: UnpersistedDdDiveGroup
    callback: (group: DdDiveGroup) => any
}

export class GroupEditorModal extends ModalPart<GroupModalState> {

    form!: GroupForm
    saveKey = messages.untypedKey()
    deleteKey = messages.untypedKey()

    async init() {
        const group = this.state.group
        this.form = this.makePart(GroupForm, {group})

        this.setTitle(group.id?.length ? "Edit Group" : "New Group")
        this.setIcon('glyp-grouped')

        this.addAction({
            title: 'Save',
            icon: 'glyp-checkmark',
            click: {key: this.saveKey}
        })

        if (group.id?.length && this.state.session.isSuper) {
            this.addAction({
                title: 'Delete',
                icon: 'glyp-delete',
                classes: ['alert'],
                click: {key: this.deleteKey}
            }, 'secondary')
        }

        this.onClick(this.saveKey, _ => {
            this.save()
        })


        this.onClick(this.deleteKey, async _ => {
            this.app.confirm({
                title: 'Delete this group?',
                body: "Are you sure you want to delete this group?",
                icon: 'glyp-delete'
            }, () => {
                this.delete()
            })
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

    async delete() {
        const group = {...this.state.group}
        group._state = 2
        const res = await Db().upsert('dd_dive_group', group)
        if (res.status == 'success') {
            this.pop()
            this.successToast(`Deleted group ${group.name}`)
            Nav.visit(routes.list.path({}))
        } else {
            this.form.setErrors(res.errors)
        }
    }


}