import {DdContentPart} from "../dd-parts"
import {FromTableRef, JoinedTableRef, TableRef} from "./query"
import {PartTag} from "tuff-core/parts"
import {SchemaDef} from "../../terrier/schema"
import inflection from "inflection"


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
            panel.div('.panel-header', header => {
                header.div('.title', {text: this.tableName})
            })
        })
        parent.div('.joins-column', col => {
            for (const jte of this.joinedEditors) {
                col.part(jte)
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