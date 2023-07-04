import {PartTag} from "tuff-core/parts"
import Schema, {BelongsToDef, ModelDef, SchemaDef} from "../../terrier/schema"
import inflection from "inflection"
import Filters, {Filter, FilterInput, FiltersEditorModal} from "./filters"
import Columns, {ColumnRef, ColumnsEditorModal} from "./columns"
import {messages} from "tuff-core"
import {Logger} from "tuff-core/logging"
import ContentPart from "../../terrier/parts/content-part"
import {ActionsDropdown} from "../../terrier/dropdowns"
import {ModalPart} from "../../terrier/modals"
import TerrierFormPart from "../../terrier/parts/terrier-form-part"

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
}

export type JoinedTableRef = TableRef & {
    join_type: 'inner' | 'left'
    belongs_to: string
}


////////////////////////////////////////////////////////////////////////////////
// Keys
////////////////////////////////////////////////////////////////////////////////

const updatedKey = messages.typedKey<TableRef>()


////////////////////////////////////////////////////////////////////////////////
// Inputs
////////////////////////////////////////////////////////////////////////////////

/**
 * Recursively collects all of the filters for this and all joined tables.
 * Only keep one (the last one traversed) per table/column combination.
 * This means that some filters may clobber others, but I think it will yield
 * the desired result most of the time.
 * @param table
 */
function computeFilterInputs(schema: SchemaDef, table: TableRef, filters: Record<string, FilterInput>) {
    for (const f of table.filters || []) {
        const fi = Filters.toInput(schema, table, f)
        filters[fi.input_key] = fi
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

export class TableView<T extends TableRef> extends ContentPart<{ schema: SchemaDef, table: T }> {

    schema!: SchemaDef
    table!: T
    tableName!: string
    displayName!: string
    modelDef!: ModelDef
    parentView?: TableView<any>

    editTableKey = messages.untypedKey()
    editColumnsKey = messages.untypedKey()
    editFiltersKey = messages.untypedKey()
    newJoinedKey = messages.untypedKey()
    createJoinedKey = messages.typedKey<{name: string}>()

    async init() {
        this.schema = this.state.schema
        this.table = this.state.table
        this.modelDef = this.schema.models[this.table.model]
        this.tableName = inflection.titleize(inflection.tableize(this.table.model))
        this.displayName = this.tableName
        this.updatedJoinedViews()

        this.onClick(this.editColumnsKey, _ => {
            log.info(`Edit ${this.displayName} Columns`)
            this.app.showModal(ColumnsEditorModal, {schema: this.schema, tableView: this as TableView<TableRef>})
        })

        this.onClick(this.editFiltersKey, _ => {
            log.info(`Edit ${this.displayName} Filters`)
            this.app.showModal(FiltersEditorModal, {schema: this.schema, tableView: this as TableView<TableRef>})
        })

        this.onClick(this.newJoinedKey, m => {
            log.info(`Adding join to ${this.displayName}`)

            // only show belongs-tos that aren't already joined
            const existingJoins = new Set(Object.keys(this.table.joins || []))
            const actions = Object.values(this.modelDef.belongs_to)
                .filter(bt => !existingJoins.has(bt.name))
                .map(bt => {
                    return {
                        title: Schema.belongsToDisplay(bt),
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

        this.onClick(this.createJoinedKey, m => {
            const belongsTo = this.modelDef.belongs_to[m.data.name]
            if (belongsTo) {
                log.info(`Creating join for ${this.displayName} to ${belongsTo.name}`, belongsTo)
                const table: JoinedTableRef = {
                    model: belongsTo.model,
                    join_type: 'inner',
                    belongs_to: belongsTo.name
                }
                const callback = (newTable: JoinedTableRef) => {
                    log.info(`Creating joined table`, newTable)
                    this.table.joins ||= {}
                    this.table.joins[newTable.belongs_to] = newTable
                    this.updatedJoinedViews()
                }
                this.app.showModal(JoinedTableEditorModal, {table, belongsTo, callback, parentTable: this.state.table as TableRef})
            }
        })
    }

    /**
     * Re-generates all views for the joined tables.
     */
    updatedJoinedViews() {
        const states = Object.values(this.table.joins || {}).map(table => {
            return {schema: this.schema, table}
        })
        this.assignCollection('joined', JoinedTableView, states)
        for (const part of this.getCollectionParts('joined')) {
            (part as JoinedTableView).parentView = this
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

        this.renderCollection(parent, 'joined')
            .class('joins-column')

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
                    })
                }
            }
            else {
                section.div('.line.empty').div().text('None')
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
                        const columnDef = this.modelDef.columns[filter.column]
                        Filters.renderStatic(line, filter, columnDef)
                    })
                }
            } else {
                section.div('.line.empty').text('None')
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
                const callback = (newTable: JoinedTableRef) => {
                    log.info(`Updated joined table ${this.displayName}`, newTable)
                    this.parentView!.table.joins[newTable.belongs_to] = newTable
                    this.table = newTable
                    this.parentView?.dirty()
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
    callback: (tableRef: JoinedTableRef) => any
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
    applyKey = messages.untypedKey()

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
            this.pop()
        })
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
