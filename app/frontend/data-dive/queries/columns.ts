import {PartTag} from "tuff-core/parts"
import {DdModalPart, DdFormPart, DdDropdown} from "../dd-parts";
import {ColumnDef, ModelDef, SchemaDef} from "../../terrier/schema"
import {TableEditor, TableRef} from "./tables"
import {Logger} from "tuff-core/logging"
import {SelectOptions} from "tuff-core/forms"
import Forms from "../../terrier/forms"
import {arrays, messages} from "tuff-core"
import Objects from "tuff-core/objects"

const log = new Logger("Columns")

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
        parent.div('.function').text(`${col.function}(<strong>${col.name}</strong>)`)
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

const saveKey = messages.untypedKey()
const addKey = messages.untypedKey()
const removeKey = messages.typedKey<{id: string}>()

/**
 * A modal that lets the user edit the columns being referenced for a particular table.
 */
export class ColumnsEditorModal extends DdModalPart<ColumnsEditorState> {

    modelDef!: ModelDef
    table!: TableRef
    columnStates: ColumnState[] = []
    columnCount = 0

    updateColumnEditors() {
        this.assignCollection('columns', ColumnEditor, this.columnStates)
    }

    addState(col: ColumnRef) {
        this.columnCount += 1
        this.columnStates.push({schema: this.state.schema, columnsEditor: this, id: `column-${this.columnCount}`, ...col})
    }


    async init () {
        this.table = this.state.tableEditor.table
        this.modelDef = this.state.tableEditor.modelDef

        // initialize the columns states
        const columns: ColumnRef[] = this.table.columns || []
        for (const col of columns) {
            this.addState(col)
        }
        this.updateColumnEditors()

        this.setTitle(`Columns for ${this.state.tableEditor.displayName}`)
        this.setIcon('glyp-columns')

        this.addAction({
            title: 'Apply',
            icon: 'glyp-checkmark',
            click: {key: saveKey}
        }, 'primary')

        this.addAction({
            title: 'Add Columns',
            icon: 'glyp-plus',
            click: {key: addKey}
        }, 'secondary')

        this.onClick(saveKey, _ => {
            this.save()
        })

        this.onClick(removeKey, m => {
            this.removeColumn(m.data.id)
        })

        this.onClick(addKey, m => {
            const onSelected = (columns: string[]) => {
                log.info(`Adding ${columns.length} columns`, columns)
                for (const col of columns) {
                    const colDef = this.modelDef.columns[col]
                    if (colDef) {
                        this.addState(colDef)
                    }
                }
                this.updateColumnEditors()
            }
            this.toggleDropdown(SelectColumnsDropdown, {modelDef: this.modelDef, callback: onSelected}, m.event.target)
        })
    }

    renderContent(parent: PartTag): void {
        parent.div('.dd-columns-editor-table', table => {
            table.div('.dd-editor-header', header => {
                header.div('.name').label({text: "Name"})
                header.div('.alias').label({text: "Alias"})
                header.div('.function').label({text: "Function"})
                header.div('.group-by').label({text: "Group By?"})
            })
            this.renderCollection(table, 'columns')
                .class('dd-editor-row-container')
        })
    }

    removeColumn(id: string) {
        const col = arrays.find(this.columnStates, c => c.id == id)
        if (col) {
            this.columnStates = arrays.without(this.columnStates, col)
            this.updateColumnEditors()
        }
    }

    save() {
        const columns = this.columnStates.map(state => {
            return Objects.omit(state, 'schema', 'columnsEditor', 'id') as ColumnRef
        })
        this.state.tableEditor.updateColumns(columns)
        this.pop()
    }

}

type ColumnState = ColumnRef & {
    schema: SchemaDef
    columnsEditor: ColumnsEditorModal
    id: string
}

/**
 * An editor row for an individual column.
 */
class ColumnEditor extends DdFormPart<ColumnState> {

    schema!: SchemaDef
    modelDef!: ModelDef
    columnDef!: ColumnDef

    functionOptions!: SelectOptions

    async init() {
        this.schema = this.state.schema
        this.modelDef = this.state.columnsEditor.modelDef
        this.columnDef = this.modelDef.columns[this.state.name]
        log.info(`Column ${this.state.name} definition:`, this.columnDef)

        let funcs = Array.from<string>(AggFunctions)
        if (this.columnDef.type == 'date' || this.columnDef.type.includes('time')) {
            funcs = funcs.concat(Array.from(DateFunctions))
        }
        this.functionOptions = Forms.titleizeOptions(funcs, '')
    }

    get parentClasses(): Array<string> {
        return super.parentClasses.concat(['dd-editor-row'])
    }

    render(parent: PartTag) {
        parent.div('.name', col => {
            col.div('.tt-readonly-field', {text: this.state.name})
        })
        parent.div('.alias', col => {
            this.textInput(col, "alias", {placeholder: "Alias"})
        })
        parent.div('.function', col => {
            this.select(col, "function", this.functionOptions)
        })
        parent.div('.group-by', col => {
            this.checkbox(col, "grouped")
        })
        parent.div('.actions', actions => {
            actions.a(a => {
                a.i('.glyp-close')
            }).emitClick(removeKey, {id: this.state.id})
        })
    }
    
}


const checkAllKey = messages.untypedKey()
const applySelectionKey = messages.untypedKey()
const checkChangedKey = messages.typedKey<{column: string}>()

type SelectColumnsCallback = (columns: string[]) => any

/**
 * Shows a dropdown that allows the user to select one or more columns from the given model.
 */
class SelectColumnsDropdown extends DdDropdown<{modelDef: ModelDef, callback: SelectColumnsCallback}> {

    checked: Set<string> = new Set()
    columns!: string[]

    async init() {
        this.columns = Object.keys(this.state.modelDef.columns).sort()

        this.onClick(checkAllKey, _ => {
            // toggle them all being checked
            const trues = Object.values(this.checked).filter(b => b)
            if (trues.length > this.columns.length / 2) {
                this.checked = new Set()
            }
            else {
                for (const c of this.columns) {
                    this.checked.add(c)
                }
            }
            this.dirty()
        })

        this.onClick(applySelectionKey, _ => {
            this.state.callback(Array.from(this.checked))
            this.clear()
        })

        this.onChange(checkChangedKey, m => {
            const col = m.data.column
            const checked = (m.event.target as HTMLInputElement).checked
            log.info(`Column '${col}' checkbox changed to`, checked)
            if (checked) {
                this.checked.add(col)
            }
            else {
                this.checked.delete(col)
            }
        })
    }


    get parentClasses(): Array<string> {
        return super.parentClasses.concat(['dd-select-columns-dropdown']);
    }

    renderContent(parent: PartTag) {
        parent.a(a => {
            a.i('.glyp-check_all')
            a.span({text: "Toggle All"})
        }).emitClick(checkAllKey)

        for (const col of this.columns) {
            parent.label(label => {
                label.input({type: 'checkbox', checked: this.checked.has(col)})
                    .emitChange(checkChangedKey, {column: col})
                label.div().text(col)
            })
        }

        parent.a(a => {
            a.i('.glyp-checkmark')
            a.span({text: "Add Selected"})
        }).emitClick(applySelectionKey)
    }

}


////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Columns = {
    render
}

export default Columns