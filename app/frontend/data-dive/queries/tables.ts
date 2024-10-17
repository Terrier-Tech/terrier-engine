import {PartTag} from "tuff-core/parts"
import Schema, {BelongsToDef, ModelDef, SchemaDef} from "../../terrier/schema"
import * as inflection from "inflection"
import Filters, {Filter, FilterInput, FiltersEditorModal} from "./filters"
import Columns, {ColumnRef, ColumnsEditorModal} from "./columns"
import {Logger} from "tuff-core/logging"
import ContentPart from "../../terrier/parts/content-part"
import {ActionsDropdown} from "../../terrier/dropdowns"
import {ModalPart} from "../../terrier/modals"
import TerrierFormPart from "../../terrier/parts/terrier-form-part"
import DiveEditor from "../dives/dive-editor"
import Messages from "tuff-core/messages"
import Arrays from "tuff-core/arrays"
import QueryEditor from "./query-editor"
import {Query} from "./queries";

const log = new Logger("Tables")

////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

export type TableRef = {
    model: string
    prefix?: string
    columns?: ColumnRef[]
    joins?: Record<string, JoinedTableRef>
    filters?: Filter[]
    _id?: string // ephemeral
}

export type JoinedTableRef = TableRef & {
    join_type: 'inner' | 'left'
    belongs_to: string
}


////////////////////////////////////////////////////////////////////////////////
// Keys
////////////////////////////////////////////////////////////////////////////////

const updatedKey = Messages.typedKey<TableRef>()


////////////////////////////////////////////////////////////////////////////////
// Inputs
////////////////////////////////////////////////////////////////////////////////

/**
 * Recursively collects all of the filters for this and all joined tables.
 * Only keep one (the last one traversed) per table/column combination.
 * This means that some filters may clobber others, but I think it will yield
 * the desired result most of the time.
 * @param schema
 * @param table
 * @param filters
 */
function computeFilterInputs(schema: SchemaDef, table: TableRef, filters: Record<string, FilterInput>) {
    for (const f of table.filters || []) {
        const fi = Filters.toInput(schema, table, f)
        filters[fi.id] = fi
    }
    if (table.joins) {
        for (const j of Object.values(table.joins)) {
            computeFilterInputs(schema, j, filters)
        }
    }
}


////////////////////////////////////////////////////////////////////////////////
// View
////////////////////////////////////////////////////////////////////////////////

export class TableView<T extends TableRef> extends ContentPart<{ schema: SchemaDef, queryEditor: QueryEditor, table: T }> {

    schema!: SchemaDef
    query!: Query
    table!: T
    tableName!: string
    displayName!: string
    modelDef!: ModelDef
    parentView?: TableView<any>

    joinParts: Record<string, TableView<JoinedTableRef>> = {}

    editTableKey = Messages.untypedKey()
    editColumnsKey = Messages.untypedKey()
    editFiltersKey = Messages.untypedKey()
    newJoinedKey = Messages.untypedKey()
    createJoinedKey = Messages.typedKey<{name: string}>()

    async init() {
        this.schema = this.state.schema
        this.query = this.state.queryEditor.state.query
        this.table = this.state.table
        this.modelDef = this.schema.models[this.table.model]
        this.tableName = inflection.titleize(inflection.tableize(this.table.model))
        this.displayName = this.tableName

        // create parts for the existing joins
        Object.values(this.table.joins || {}).map(table => {
            this.addJoinedPart(table)
        })

        this.onClick(this.editColumnsKey, _ => {
            log.info(`Edit ${this.displayName} Columns`)
            this.app.showModal(ColumnsEditorModal, {schema: this.schema, query: this.query, tableView: this as TableView<TableRef>})
        })

        this.onClick(this.editFiltersKey, _ => {
            log.info(`Edit ${this.displayName} Filters`)
            this.app.showModal(FiltersEditorModal, {schema: this.schema, tableView: this as TableView<TableRef>})
        })

        // show the new join dropdown
        this.onClick(this.newJoinedKey, m => {
            log.info(`Adding join to ${this.displayName}`)

            // only show belongs-tos that aren't already joined
            const existingJoins = new Set(Object.keys(this.table.joins || []))

            const newJoins = Object.values(this.modelDef.belongs_to)
                .filter(bt => !existingJoins.has(bt.name))

            // show the common tables at the top
            let showingCommon = true
            const actions = Arrays.sortByFunction(newJoins, bt => {
                const model = this.schema.models[bt.model]
                const common = model.metadata?.visibility == 'common' ? '0' : '1'
                return `${common}${bt.name}`
            })
            .map(bt => {
                const model = this.schema.models[bt.model]
                const isCommon = model.metadata?.visibility == 'common'
                // put a border between the common and uncommon
                const classes = showingCommon && !isCommon ? ['border-top'] : []
                showingCommon = isCommon
                return {
                    title: Schema.belongsToDisplay(bt),
                    subtitle: model.metadata?.description,
                    classes,
                    click: {key: this.createJoinedKey, data: {name: bt.name}}
                }
            })


            // don't show the dropdown if there are no more belongs-tos left
            if (actions.length) {
                this.toggleDropdown(ActionsDropdown, actions, m.event.target)
            }
            else {
                this.showToast(`No more possible joins for ${this.displayName}`, {color: 'pending'})
            }
        })

        // create a new join
        this.onClick(this.createJoinedKey, m => {
            const belongsTo = this.modelDef.belongs_to[m.data.name]
            if (belongsTo) {
                log.info(`Creating join for ${this.displayName} to ${belongsTo.name}`, belongsTo)
                const table: JoinedTableRef = {
                    model: belongsTo.model,
                    join_type: 'inner',
                    belongs_to: belongsTo.name
                }
                const callback = (newTable: JoinedTableRef | null) => {
                    if (newTable) {
                        log.info(`Creating joined table`, newTable)
                        this.table.joins ||= {}
                        this.table.joins[newTable.belongs_to] = newTable
                        this.addJoinedPart(newTable)
                        this.dirty()
                    }
                }
                this.app.showModal(JoinedTableEditorModal, {table, belongsTo, callback, parentTable: this.state.table as TableRef})
            }
        })
    }

    addJoinedPart(joinedTable: JoinedTableRef) {
        const state = {schema: this.schema, queryEditor: this.state.queryEditor, table: joinedTable}
        const part = this.makePart(JoinedTableView, state)
        part.parentView = this
        this.joinParts[joinedTable.belongs_to] = part
    }


    removeJoinedPart(joinedTable: JoinedTableRef) {
        if (this.table?.joins) {
            delete this.table.joins[joinedTable.belongs_to]
            delete this.joinParts[joinedTable.belongs_to]
            this.dirty()
        }
    }


    get parentClasses(): Array<string> {
        const classes = ['dd-table-editor']
        if ('join_type' in this.state.table) {
            classes.push('joined')
        }
        else {
            classes.push('from')
        }
        return classes
    }

    renderContent(parent: PartTag): void {
        if ('join_type' in this.state.table) {
            parent.div('.chicken-foot')
        }

        parent.div('.joins-column', col => {
            for (const name of Object.keys(this.joinParts).sort()) {
                col.part(this.joinParts[name])
            }
        })

        parent.div(".tt-panel.table-panel", panel => {
            panel.div('.title', title => {
                const t = this.table as any
                if ('join_type' in t) {
                    title.i(`.glyp-join_${t.join_type}`)
                }
                else { // it's the main table
                    title.i('.glyp-table')
                }
                title.div().text(this.displayName)
            }).emitClick(this.editTableKey)

            this.renderColumns(panel)

            this.renderFilters(panel)

            panel.a('.action', a => {
                a.i('.glyp-plus')
                a.div().text("Join")
                a.i('.glyp-belongs_to')
            }).emitClick(this.newJoinedKey)

            // join hint
            if (!Object.keys(this.table.joins || {}).length) {
                panel.a('.dd-hint.joins.arrow-top.glyp-hint', hint => {
                    hint.div('.title').text("Join More Tables")
                })
                .emitClick(this.newJoinedKey)
                .data({tooltip: "Include data from other tables that are related to this one"})
            }
        })

    }

    renderColumns(parent: PartTag) {
        parent.section(section => {
            section.div('.title', title => {
                title.i(".glyp-columns")
                title.span({text: "Columns"})
                if (this.table.prefix?.length) {
                    title.span('.prefix').text(`${this.table.prefix}*`)
                }
            })
            if (this.table.columns?.length) {
                for (const col of this.table.columns) {
                    section.div('.column.line', line => {
                        Columns.render(line, col)
                        if (col.errors?.length) {
                            line.class('error')
                            for (const error of col.errors) {
                                line.div('.error-message').text(error.message)
                            }
                        }
                    })
                }
            }
            else {
                section.div('.line.empty').div().text('None')
                section.div('.dd-hint-container', hintContainer => {
                    hintContainer.div('dd-hint.glyp-hint', hint => {
                        hint.div('.hint-title').text("Add Columns")
                    })
                })
            }
        }).emitClick(this.editColumnsKey, {})
    }

    renderFilters(parent: PartTag) {
        parent.section('.filters', section => {
            section.div('.title', title => {
                title.i(".glyp-filter")
                title.span({text: "Filters"})
            })
            if (this.table.filters?.length) {
                for (const filter of this.table.filters) {
                    section.div('.filter.line', line => {
                        Filters.renderStatic(line, filter)
                    })
                }
            } else {
                section.div('.line.empty').text('None')
                section.div('.dd-hint-container', hintContainer => {
                    hintContainer.div('dd-hint.glyp-hint', hint => {
                        hint.div('.hint-title').text("Add Filters")
                    })
                })
            }
        }).emitClick(this.editFiltersKey, {})
    }

    /**
     * Let everyone know that the table was updated.
     */
    sendUpdateMessage() {
        this.emitMessage(updatedKey, this.state.table)
    }

    updateColumns(columns: ColumnRef[], prefix?: string) {
        this.state.table.columns = columns
        this.state.table.prefix = prefix
        this.sendUpdateMessage()
        this.dirty()
    }

    updateFilters(filters: Filter[]) {
        this.state.table.filters = filters
        this.sendUpdateMessage()
        this.dirty()
    }

}

export class FromTableView extends TableView<TableRef> {

}

export class JoinedTableView extends TableView<JoinedTableRef> {

    async init() {
        await super.init()

        this.displayName = inflection.titleize(this.table.belongs_to)

        // I don't think it makes much sense to be able edit the root table,
        // so this is only available down here on the joined tables
        this.onClick(this.editTableKey, _ => {
            if (this.parentView) {
                log.info(`Editing join table ${this.displayName}`)
                const parentModel = this.parentView.modelDef
                const belongsTo = parentModel.belongs_to[this.table.belongs_to]
                const callback = (newTable: JoinedTableRef | null) => {
                    if (newTable) {
                        log.info(`Updated joined table ${this.displayName}`, newTable)
                        this.parentView!.table.joins[newTable.belongs_to] = newTable
                        this.table = newTable
                        this.parentView?.dirty()
                    }
                    else {
                        log.info(`Deleted joined table ${this.displayName}`)
                        this.parentView!.removeJoinedPart(this.table)
                    }
                }
                this.app.showModal(JoinedTableEditorModal, {
                    table: this.table,
                    belongsTo,
                    callback,
                    parentTable: this.parentView?.table
                })
            }
            else {
                alert(`Parent table was never assigned!`)
            }
        })
    }

}


////////////////////////////////////////////////////////////////////////////////
// Editor
////////////////////////////////////////////////////////////////////////////////

type JoinedTableEditorState = {
    table: JoinedTableRef
    readonly parentTable: TableRef
    belongsTo: BelongsToDef
    callback: (tableRef: JoinedTableRef | null) => any
}

/**
 * A form for editing the join type of a joined table.
 */
class JoinedTableEditorForm extends TerrierFormPart<JoinedTableRef> {

    parentTable!: TableRef

    render(parent: PartTag) {
        const name = inflection.titleize(this.state.belongs_to)
        const parentName = this.parentTable.model

        parent.div('.tt-padded.tt-inset-box', box => {
            box.h4('.justify-center', h4 => {
                h4.i('.glyp-join')
                h4.div().text("Join Type")
            })
            box.div('.tt-flex.gap.padded', row => {
                row.div('.stretch', col => {
                    col.label('.body-size', label => {
                        label.i('.glyp-join_inner')
                        this.radio(label, 'join_type', 'inner')
                        label.div().text(`<strong>Inner</strong>: <em>${parentName}</em> is only included if there's an associated <em>${name}</em>`)
                    })
                })
                row.div('.stretch', col => {
                    col.label('.body-size', label => {
                        label.i('.glyp-join_left')
                        this.radio(label, 'join_type', 'left')
                        label.div().text(`<strong>Left</strong>: <em>${parentName}</em> is included even if there's no associated <em>${name}</em>`)
                    })
                })
            })
        })
    }

}

/**
 * A modal for editing the join type of a joined table.
 */
class JoinedTableEditorModal extends ModalPart<JoinedTableEditorState> {

    form!: JoinedTableEditorForm
    applyKey = Messages.untypedKey()
    deleteKey = Messages.untypedKey()

    async init() {
        this.form = this.makePart(JoinedTableEditorForm, this.state.table)
        this.form.parentTable = this.state.parentTable

        this.setIcon('glyp-join')
        this.setTitle(`Join ${this.state.parentTable.model} <i class='glyp-belongs_to'></i> ${Schema.belongsToDisplay(this.state.belongsTo)}`)

        this.addAction({
            title: "Apply",
            icon: 'glyp-checkmark',
            click: {key: this.applyKey}
        }, 'primary')

        this.onClick(this.applyKey, async _ => {
            const table = await this.form.serialize()
            this.state.callback(table)
            this.emitMessage(DiveEditor.diveChangedKey, {})
            this.pop()
        })

        const parentJoins = this.state.parentTable!.joins
        if (parentJoins && parentJoins[this.state.table.belongs_to]) {
            // don't show the delete action if the join isn't already in the parent
            this.addAction({
                title: "Delete",
                icon: "glyp-delete",
                click: {key: this.deleteKey},
                classes: ['alert']
            }, 'secondary')

            this.onClick(this.deleteKey, async _ => {
                this.state.callback(null)
                this.emitMessage(DiveEditor.diveChangedKey, {})
                this.pop()
            })
        }
    }

    renderContent(parent: PartTag) {
        parent.div('.tt-padded').part(this.form)
    }

}


////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Tables = {
    updatedKey,
    computeFilterInputs
}

export default Tables
