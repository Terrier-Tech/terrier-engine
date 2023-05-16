import {DdContentPart} from "../dd-parts"
import {ColumnRef, FromTableRef, JoinedTableRef, TableRef} from "./query"
import {PartTag} from "tuff-core/parts"
import {SchemaDef} from "../../terrier/schema"
import inflection from "inflection"
import Filters from "./filters"


export class TableEditor<T extends TableRef> extends DdContentPart<{ schema: SchemaDef, table: T }> {

    schema!: SchemaDef
    table!: T
    tableName!: string
    joinedEditors: JoinedTableEditor[] = []

    async init() {
        this.schema = this.state.schema
        this.table = this.state.table
        this.makeJoinedEditors()
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
        parent.div(".tt-panel.table-panel", panel => {
            panel.div('.title', {text: this.tableName})
            this.renderColumns(panel)
            this.renderFilters(panel)
        })
        parent.div('.joins-column', col => {
            for (const jte of this.joinedEditors) {
                col.part(jte)
            }
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
                    this.renderColumn(section, col)
                }
            }
            else {
                section.div('.empty.line', {text: "None"})
            }
        })
    }

    renderColumn(parent: PartTag, col: ColumnRef) {
        parent.div('.column.line', line => {
            if (col.function?.length) {
                line.div('.name').text(`${col.function}(${col.name})`)
            }
            else {
                line.div('.name').text(col.name)
            }
            if (col.alias?.length) {
                line.div('.alias').text(col.alias)
            }
        })
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
                section.div('.empty.line', {text: "None"})
            }
        })
    }

}

export class FromTableEditor extends TableEditor<FromTableRef> {

    async init() {
        await super.init()

        this.tableName = inflection.titleize(inflection.tableize(this.table.model))
    }

}

export class JoinedTableEditor extends TableEditor<JoinedTableRef> {

    async init() {
        await super.init()

        this.tableName = inflection.titleize(this.table.belongs_to)
    }

}