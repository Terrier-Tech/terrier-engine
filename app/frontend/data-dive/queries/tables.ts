import {DdContentPart} from "../dd-parts"
import {PartTag} from "tuff-core/parts"
import {ModelDef, SchemaDef} from "../../terrier/schema"
import inflection from "inflection"
import Filters, {Filter, FiltersEditorModal} from "./filters"
import Columns, {ColumnRef, ColumnsEditorModal} from "./columns"
import {messages} from "tuff-core"
import {Logger} from "tuff-core/logging"

const log = new Logger("Tables")

////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

export type TableRef = {
    model: string
    columns?: ColumnRef[]
    joins?: JoinedTableRef[]
    filters?: Filter[]
}

export type JoinedTableRef = TableRef & {
    join_type: 'inner' | 'left'
    belongs_to: string
}


////////////////////////////////////////////////////////////////////////////////
// Editor
////////////////////////////////////////////////////////////////////////////////

export class TableEditor<T extends TableRef> extends DdContentPart<{ schema: SchemaDef, table: T }> {

    schema!: SchemaDef
    table!: T
    tableName!: string
    displayName!: string
    modelDef!: ModelDef

    editColumnsKey = messages.untypedKey()
    editFiltersKey = messages.untypedKey()

    async init() {
        this.schema = this.state.schema
        this.table = this.state.table
        this.modelDef = this.schema.models[this.table.model]
        this.tableName = inflection.titleize(inflection.tableize(this.table.model))
        this.displayName = this.tableName
        this.makeJoinedEditors()

        this.onClick(this.editColumnsKey, _ => {
            log.info(`Edit ${this.tableName} Columns`)
            this.app.showModal(ColumnsEditorModal, {schema: this.schema, tableEditor: this as TableEditor<TableRef>})
        })

        this.onClick(this.editFiltersKey, _ => {
            log.info(`Edit ${this.tableName} Filters`)
            this.app.showModal(FiltersEditorModal, {schema: this.schema, tableEditor: this as TableEditor<TableRef>})
        })
    }

    /**
     * Re-generates all editors for the joined tables.
     */
    makeJoinedEditors() {
        const states = (this.table.joins || []).map(table => {
            return {schema: this.schema, table}
        })
        this.assignCollection('joined', JoinedTableEditor, states)
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
                title.i('.glyp-table')
                title.div().text(this.displayName)
            })

            this.renderColumns(panel)

            this.renderFilters(panel)

            panel.a('.action', a => {
                a.i('.glyp-plus')
                a.div().text("Belongs-To")
                a.i('.glyp-belongs_to')
            })
        })
    }

    renderColumns(parent: PartTag) {
        parent.section(section => {
            section.div('.title', title => {
                title.i(".glyp-columns")
                title.span({text: "Columns"})
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
                        Filters.render(line, filter)
                    })
                }
            } else {
                section.div('.line.empty').text('None')
            }
        }).emitClick(this.editFiltersKey, {})
    }

    renderJoins(parent: PartTag) {
        parent.section(section => {
            section.div('.title', title => {
                title.i(".glyp-belongs_to")
                title.span({text: "Joins"})
            })
            section.div('.line.empty', line => {
                line.i('.glyp-plus')
                line.div().text('Belongs-To')
            })
        })
    }

    updateColumns(columns: ColumnRef[]) {
        this.state.table.columns = columns
        this.dirty()
    }

    updateFilters(filters: Filter[]) {
        this.state.table.filters = filters
        this.dirty()
    }

}

export class FromTableEditor extends TableEditor<TableRef> {

    async init() {
        await super.init()

    }

}

export class JoinedTableEditor extends TableEditor<JoinedTableRef> {

    async init() {
        await super.init()

        this.displayName = inflection.titleize(this.table.belongs_to)
    }

}