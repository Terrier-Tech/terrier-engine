import {DdContentPart} from "../dd-parts"
import {FromTableRef, JoinedTableRef, TableRef} from "./query"
import {PartTag} from "tuff-core/parts"
import {SchemaDef} from "../../terrier/schema"
import inflection from "inflection"
import Filters from "./filters"
import Columns from "./columns"


export class Tables<T extends TableRef> extends DdContentPart<{ schema: SchemaDef, table: T }> {

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
                section.div('.line').div('.empty').text('None')
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
                section.div('.line').div('.empty').text('None')
            }
        })
    }

}

export class FromTableEditor extends Tables<FromTableRef> {

    async init() {
        await super.init()

        this.tableName = inflection.titleize(inflection.tableize(this.table.model))
    }

}

export class JoinedTableEditor extends Tables<JoinedTableRef> {

    async init() {
        await super.init()

        this.tableName = inflection.titleize(this.table.belongs_to)
    }

}