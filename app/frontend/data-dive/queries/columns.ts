import {PartTag} from "tuff-core/parts"
import {DdModalPart, DdFormPart} from "../dd-parts";
import {ColumnDef, ModelDef, SchemaDef} from "../../terrier/schema"
import {TableEditor, TableRef} from "./tables"

////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

/**
 * Possible functions used to aggregate a column.
 */
const AggFunctions = ['count', 'min', 'max'] as const

export type AggFunction = typeof AggFunctions[number]


/**
 * Possible functions used to manipulate a date column.
 */
const DateFunctions = ['year', 'month', 'day'] as const

export type DateFunction = typeof DateFunctions[number]


export type ColumnRef = {
    name: string
    alias?: string
    grouped?: boolean
    function?: AggFunction | DateFunction
}


////////////////////////////////////////////////////////////////////////////////
// Rendering
////////////////////////////////////////////////////////////////////////////////

function render(parent: PartTag, col: ColumnRef) {
    if (col.function?.length) {
        parent.div('.name').text(`${col.function}(<strong>${col.name}</strong>)`)
    } else {
        parent.div('.name').text(col.name)
    }
    if (col.alias?.length) {
        parent.div('.as').text('as')
        parent.div('.alias').text(col.alias)
    }
}


////////////////////////////////////////////////////////////////////////////////
// Editor
////////////////////////////////////////////////////////////////////////////////

export type ColumnsEditorState = {
    schema: SchemaDef
    tableEditor: TableEditor<TableRef>
}

export class ColumnsEditorModal extends DdModalPart<ColumnsEditorState> {

    modelDef!: ModelDef
    columnStates: ColumnState[] = []
    columnEditors: ColumnEditor[] = []

    updateColumnEditors() {
        for (const editor of this.columnEditors) {
            this.removeChild(editor)
        }
        this.columnEditors = this.columnStates.map(colState => {
            return this.makePart(ColumnEditor, colState)
        })
    }

    table!: TableRef

    async init () {
        this.table = this.state.tableEditor.table
        this.modelDef = this.state.tableEditor.modelDef

        // store the states of each potential column
        const columns: ColumnRef[] = this.state.tableEditor.table.columns || []
        this.columnStates = columns.map(col => {
            return {schema: this.state.schema, table: this.table, model: this.modelDef, ...col}
        })
        this.updateColumnEditors()

        this.setTitle(`Columns for ${this.state.tableEditor.tableName}`)
        this.setIcon('glyp-columns')
    }

    renderContent(parent: PartTag): void {
        parent.div('.dd-columns-editor-table', table => {
            table.div('.dd-column-editor-header', header => {
                header.div('.name').label({text: "Name"})
                header.div('.alias').label({text: "Alias"})
            })
            for (const editor of this.columnEditors) {
                table.part(editor)
            }
        })
    }

}

type ColumnState = ColumnRef & {
    schema: SchemaDef
    table: TableRef
    model: ModelDef
}

class ColumnEditor extends DdFormPart<ColumnState> {

    schema!: SchemaDef
    modelDef!: ModelDef
    columnDef!: ColumnDef

    async init() {
        this.schema = this.state.schema
        this.modelDef = this.state.model
    }

    get parentClasses(): Array<string> {
        return ['dd-column-editor'];
    }

    render(parent: PartTag): any {
        parent.div('.name', col => {
            this.textInput(col, "name")
        })
        parent.div('.alias', col => {
            this.textInput(col, "alias")
        })
    }
    
}


////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Columns = {
    render
}

export default Columns