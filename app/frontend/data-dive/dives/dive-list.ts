import {Logger} from "tuff-core/logging"
import PagePart from "../../terrier/parts/page-part"
import {PartTag} from "tuff-core/parts"
import Schema, {SchemaDef} from "../../terrier/schema"
import {arrays, messages} from "tuff-core"
import {DdDive, DdDiveGroup} from "../gen/models"
import Dives, {DiveListResult} from "./dives"
import {GroupEditorModal} from "./group-editor"
import Fragments from "../../terrier/fragments"
import {IconName} from "../../terrier/theme"
import {routes} from "../dd-routes"
import {DiveSettingsModal} from "./dive-form";

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
            this.app.showModal(GroupEditorModal, {group_id: '', callback: _ => this.reload()})
        })

        this.onClick(this.newDiveKey, m => {
            const groupId = m.data.group_id
            log.info(`Showing new dive modal for group ${groupId}`)
            const dive = {
                name: '',
                description_raw: '',
                visibility: 'public',
                dd_dive_group_id: groupId
            } as const
            this.app.showModal(DiveSettingsModal, {schema: this.schema, dive, groups: this.result.groups})
        })

        await this.reload()
    }

    async reload() {
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
                parent.a('.dive.tt-flex.gap', {href: routes.editor.path({id: dive.id})}).text(dive.name)
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
                    content.a('.dive.tt-flex.gap', {href: routes.editor.path({id: dive.id})})
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

