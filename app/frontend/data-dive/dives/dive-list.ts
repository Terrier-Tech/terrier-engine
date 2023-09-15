import {Logger} from "tuff-core/logging"
import PagePart from "../../terrier/parts/page-part"
import {PartTag} from "tuff-core/parts"
import Schema, {SchemaDef} from "../../terrier/schema"
import {DdDive, DdDiveGroup, UnpersistedDdDive, UnpersistedDdDiveGroup} from "../gen/models"
import Dives, {DiveListResult} from "./dives"
import {GroupEditorModal} from "./group-editor"
import Fragments from "../../terrier/fragments"
import {IconName} from "../../terrier/theme"
import {routes} from "../dd-routes"
import {DiveSettingsModal} from "./dive-settings"
import DdSession from "../dd-session"
import Messages from "tuff-core/messages"
import Arrays from "tuff-core/arrays"
import TerrierPart from "../../terrier/parts/terrier-part"

const log = new Logger("DiveList")


////////////////////////////////////////////////////////////////////////////////
// List
////////////////////////////////////////////////////////////////////////////////

export type DiveListState = {

}

/**
 * Show a list of all dive groups and dives that match the given state.
 */
export class DiveListPart extends TerrierPart<DiveListState> {

    editGroupKey = Messages.typedKey<{ id: string }>()
    newDiveKey = Messages.typedKey<{ group_id: string }>()
    editDiveKey = Messages.typedKey<{ id: string }>()

    session!: DdSession
    result!: DiveListResult
    schema!: SchemaDef
    groupMap: Record<string, DdDiveGroup> = {}
    diveMap: Record<string, DdDive> = {}


    async init() {

        this.schema = await Schema.get()
        this.session = await DdSession.get()

        this.onClick(this.editGroupKey, m => {
            log.info(`Edit group ${m.data.id}`)
            const group = this.groupMap[m.data.id]
            if (group) {
                this.app.showModal(GroupEditorModal, {
                    session: this.session,
                    group: group as UnpersistedDdDiveGroup,
                    callback: _ => this.reload()
                })
            } else {
                this.alertToast(`No group with id ${m.data.id}`)
            }
        })

        this.onClick(this.newDiveKey, m => {
            const groupId = m.data.group_id
            log.info(`Showing new dive modal for group ${groupId}`)
            const dive: UnpersistedDdDive = {
                name: '',
                description_raw: '',
                visibility: 'public',
                owner_id: this.session.user.id,
                dd_dive_group_id: groupId,
                dive_types: []
            }
            this.app.showModal(DiveSettingsModal, {schema: this.schema, dive, session: this.session})
        })

        this.onClick(this.editDiveKey, m => {
            const dive = this.diveMap[m.data.id] as UnpersistedDdDive
            if (dive) {
                log.info(`Editing settings for dive: ${dive.name}`)
                this.app.showModal(DiveSettingsModal, {schema: this.schema, dive, session: this.session})
            } else {
                log.warn(`No dive with id ${m.data.id}`)
            }
        })

        this.reload().then()
    }

    async reload() {
        this.session = await DdSession.get()
        this.result = await Dives.list()
        log.info("Loading data dive list", this.result)
        this.groupMap = this.session.data.groupMap
        this.diveMap = Arrays.indexBy(this.result.dives, 'id')
        this.dirty()
    }

    render(parent: PartTag): any {

        const groupedDives = Arrays.groupBy(this.result.dives, 'dd_dive_group_id')

        parent.div('.dd-group-grid', grid => {
            const groups = Arrays.sortBy(Object.values(this.groupMap), 'name')
            for (const group of groups) {
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
                for (const dive of Arrays.sortBy(dives, 'name')) {
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
                if (dive.visibility == 'private') {
                    a.i('.glyp-privacy')
                        .data({tooltip: "Private Dive"})
                } else {
                    a.i('.glyp-data_dive')
                }
                a.span().text(dive.name)
            }).data({tooltip: "Open Editor"})
            row.a('.icon-only', a => {
                a.i('.glyp-settings')
            }).data({tooltip: "Dive Settings"})
                .emitClick(this.editDiveKey, {id: dive.id})
        })
    }

}


////////////////////////////////////////////////////////////////////////////////
// Page
////////////////////////////////////////////////////////////////////////////////

export class DiveListPage extends PagePart<{}> {

    listPart!: DiveListPart
    newGroupKey = Messages.untypedKey()

    async init() {
        this.setTitle("Data Dive")
        this.setIcon('glyp-data_dives')
        this.mainContentWidth = 'wide'

        this.listPart = this.makePart(DiveListPart, {})

        this.addAction({
            title: "New Group",
            icon: 'glyp-plus_outline',
            click: {key: this.newGroupKey}
        }, 'tertiary')

        // we're handling this here instead of in the list part because, as of 9/15/23,
        // attach: 'passive' doesn't seem to work for click handlers,
        // so this handler never got called when it was inside the list part
        this.onClick(this.newGroupKey, _ => {
            log.info("Showing new dive group model")
            const newGroup = {name: '', group_types: []}
            this.app.showModal(GroupEditorModal, {
                session: this.listPart.session,
                group: newGroup,
                callback: _ => this.listPart.reload()
            })
        })
    }

    renderContent(parent: PartTag): void {
        parent.part(this.listPart)
    }


}

