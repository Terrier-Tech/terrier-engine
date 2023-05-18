import {DdContentPart} from "../dd-parts"
import {PartTag} from "tuff-core/parts"
import {ModelDef, SchemaDef} from "../../terrier/schema"
import inflection from "inflection"
import Filters, {Filter} from "./filters"
import Columns, {ColumnRef, ColumnsEditorModal} from "./columns"
import {messages} from "tuff-core"
import {Logger} from "tuff-core/logging"

const log = new Logger("Tables")

////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

export type TableRef = {
    columns?: ColumnRef[]
    joins?: JoinedTableRef[]
    filters?: Filter[]
}

export type FromTableRef = TableRef & {
    model: string
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
    modelDef!: ModelDef
    joinedEditors: JoinedTableEditor[] = []

    editColumnsKey = messages.untypedKey()

    async init() {
        this.schema = this.state.schema
        this.table = this.state.table
        this.makeJoinedEditors()

        this.onClick(this.editColumnsKey, _ => {
            log.info(`Edit ${this.tableName} Columns`)
            this.app.showModal(ColumnsEditorModal, {schema: this.schema, tableEditor: this as TableEditor<TableRef>})
        })
    }

    /**
     * Re-generates all editors for the joined tables.
     */
    makeJoinedEditors() {
        for (const editor of this.joinedEditors) {
            this.removeChild(editor)
        }
        if (this.table.joins?.length) {
            this.joinedEditors = this.table.joins.map(join => {
                return this.makePart(JoinedTableEditor, {schema: this.schema, table: join})
            })
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
            for (const jte of this.joinedEditors) {
                col.part(jte)
            }
        })
        parent.div(".tt-panel.table-panel", panel => {
            panel.div('.title', title => {
                title.i('.glyp-table')
                title.div().text(this.tableName)
            })
            this.renderColumns(panel)
            this.renderFilters(panel)
            this.renderJoins(panel)
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
        parent.section(section => {
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
        })
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

}

export class FromTableEditor extends TableEditor<FromTableRef> {

    async init() {
        await super.init()

        this.tableName = inflection.titleize(inflection.tableize(this.table.model))
        this.modelDef = this.schema.models[this.table.model]
    }

}

export class JoinedTableEditor extends TableEditor<JoinedTableRef> {

    async init() {
        await super.init()

        this.tableName = inflection.titleize(this.table.belongs_to)
    }

}