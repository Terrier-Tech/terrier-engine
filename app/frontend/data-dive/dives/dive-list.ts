import {Logger} from "tuff-core/logging"
import PagePart from "../../terrier/parts/page-part"
import {PartTag} from "tuff-core/parts"
import Schema, {SchemaDef} from "../../terrier/schema"
import {arrays, messages} from "tuff-core"
import {DdDive, DdDiveGroup, UnpersistedDdDive, UnpersistedDdDiveGroup} from "../gen/models"
import Dives, {DiveListResult} from "./dives"
import {GroupEditorModal} from "./group-editor"
import Fragments from "../../terrier/fragments"
import {IconName} from "../../terrier/theme"
import {routes} from "../dd-routes"
import {DiveSettingsModal} from "./dive-form"

const log = new Logger("DiveList")


////////////////////////////////////////////////////////////////////////////////
// List
////////////////////////////////////////////////////////////////////////////////

export class DiveListPage extends PagePart<{}> {

    newGroupKey = messages.untypedKey()
    editGroupKey = messages.typedKey<{id: string}>()
    newDiveKey = messages.typedKey<{group_id: string}>()
    editDiveKey = messages.typedKey<{id: string}>()

    result!: DiveListResult
    schema!: SchemaDef
    groupMap: Record<string, DdDiveGroup> = {}
    diveMap: Record<string,DdDive> = {}

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
            const newGroup = {name: '', group_types: []}
            this.app.showModal(GroupEditorModal, {group: newGroup, callback: _ => this.reload()})
        })

        this.onClick(this.editGroupKey, m => {
            log.info(`Edit group ${m.data.id}`)
            const group = this.groupMap[m.data.id]
            if (group) {
                this.app.showModal(GroupEditorModal, {group: group as UnpersistedDdDiveGroup, callback: _ => this.reload()})
            }
            else {
                this.alertToast(`No group with id ${m.data.id}`)
            }
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

        this.onClick(this.editDiveKey, m => {
            const dive = this.diveMap[m.data.id] as UnpersistedDdDive
            if (dive) {
                log.info(`Editing settings for dive: ${dive.name}`)
                this.app.showModal(DiveSettingsModal, {schema: this.schema, dive, groups: this.result.groups})
            }
            else {
                log.warn(`No dive with id ${m.data.id}`)
            }
        })

        await this.reload()
    }

    async reload() {
        this.result = await Dives.list()
        log.info("Loading data dive list", this.result)
        this.groupMap = arrays.indexBy(this.result.groups, 'id')
        this.diveMap = arrays.indexBy(this.result.dives, 'id')
        this.dirty()
    }

    renderContent(parent: PartTag): void {

        const groupedDives = arrays.groupBy(this.result.dives, 'dd_dive_group_id')

        parent.div('.dd-group-grid', grid => {
            for (const group of this.result.groups) {
                this.renderGroupPanel(grid, group, groupedDives[group.id] || [])
            }
        })
    }

    renderGroupPanel(parent: PartTag, group: DdDiveGroup, dives: DdDive[]) {
        Fragments.panel(this.theme)
            .title(group.name)
            .icon((group.icon || 'glyp-data_dives') as IconName)
            .classes('group')
            .content(content => {
                content.class('tt-list')
                for (const dive of arrays.sortBy(dives, 'name')) {
                    this.renderDiveRow(content, dive)
                }
            })
            .addAction({
                title: "New Dive",
                icon: 'glyp-data_dive',
                click: {key: this.newDiveKey, data: {group_id: group.id}}
            }, 'secondary')
            .addAction({
                icon: 'glyp-settings',
                click: {key: this.editGroupKey, data: {id: group.id}}
            }, 'tertiary')
            .render(parent)
    }

    renderDiveRow(parent: PartTag, dive: DdDive) {
        parent.div('.dive', row => {
            row.a({href: routes.editor.path({id: dive.id})}, a => {
                a.i('.glyp-data_dive')
                a.span().text(dive.name)
            }).data({tooltip: "Open Editor"})
            row.a('.icon-only', a => {
                a.i('.glyp-settings')
            }).data({tooltip: "Dive Settings"})
              .emitClick(this.editDiveKey, {id: dive.id})
        })
    }

}

