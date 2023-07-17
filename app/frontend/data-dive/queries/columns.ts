import {PartTag} from "tuff-core/parts"
import {ColumnDef, ModelDef, SchemaDef} from "../../terrier/schema"
import {TableRef, TableView} from "./tables"
import {Logger} from "tuff-core/logging"
import {FormFields, SelectOptions} from "tuff-core/forms"
import Forms from "../../terrier/forms"
import {arrays, messages} from "tuff-core"
import Objects from "tuff-core/objects"
import {ModalPart} from "../../terrier/modals";
import TerrierFormPart from "../../terrier/parts/terrier-form-part"
import {Dropdown} from "../../terrier/dropdowns"

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

export type Function = AggFunction | DateFunction

/**
 * @param fun a function name
 * @return the type of function
 */
function functionType(fun: Function): 'aggregate' | 'time' | undefined {
    if (AggFunctions.includes(fun as AggFunction)) {
        return 'aggregate'
    }
    else if (DateFunctions.includes(fun as DateFunction)) {
        return 'time'
    }
    return undefined
}

/**
 * A reference to a single column, possibly grouped or with a function applied
 */
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
    if (col.grouped) {
        parent.i('.glyp-grouped')
    }
    if (col.function?.length) {
        parent.i(`.glyp-function`)
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
    tableView: TableView<TableRef>
}

const saveKey = messages.untypedKey()
const addKey = messages.untypedKey()
const addSingleKey = messages.typedKey<{ name: string }>()
const removeKey = messages.typedKey<{id: string}>()

/**
 * A modal that lets the user edit the columns being referenced for a particular table.
 */
export class ColumnsEditorModal extends ModalPart<ColumnsEditorState> {

    modelDef!: ModelDef
    table!: TableRef
    columnStates: ColumnState[] = []
    columnCount = 0

    tableFields!: FormFields<TableRef>

    updateColumnEditors() {
        this.assignCollection('columns', ColumnEditor, this.columnStates)
    }

    addState(col: ColumnRef) {
        this.columnCount += 1
        this.columnStates.push({schema: this.state.schema, columnsEditor: this, id: `column-${this.columnCount}`, ...col})
    }


    async init () {
        this.table = this.state.tableView.table
        this.modelDef = this.state.tableView.modelDef

        this.tableFields = new FormFields(this, {...this.table})

        // initialize the columns states
        const columns: ColumnRef[] = this.table.columns || []
        for (const col of columns) {
            this.addState(col)
        }
        this.updateColumnEditors()

        this.setTitle(`Columns for ${this.state.tableView.displayName}`)
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

        this.onClick(addSingleKey, m => {
            const colDef = this.modelDef.columns[m.data.name]
            log.info(`Add column ${m.data.name}`)
            if (colDef) {
                this.addState({name: colDef.name})
                this.updateColumnEditors()
                this.dirty()
            }
            else {
                alert(`Unknown column name '${m.data.name}'`)
            }
        })

        this.onClick(addKey, m => {
            const onSelected = (columns: string[]) => {
                log.info(`Adding ${columns.length} columns`, columns)
                for (const col of columns) {
                    const colDef = this.modelDef.columns[col]
                    if (colDef) {
                        this.addState({name: colDef.name})
                    }
                }
                this.updateColumnEditors()
            }
            this.toggleDropdown(SelectColumnsDropdown, {modelDef: this.modelDef, callback: onSelected}, m.event.target)
        })
    }

    renderContent(parent: PartTag): void {
        // fields
        parent.div('.tt-flex.tt-form.padded.gap.justify-end.align-center', row => {
            row.div('.tt-compound-field', field => {
                field.label().text("Prefix:")
                this.tableFields.textInput(field, 'prefix')
            })
            row.div('.stretch').text("All columns will be prefixed with this")
        })

        // the table of column editors
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

        // common column quick links
        const includedNames = new Set(this.columnStates.map(s => s.name))
        const commonCols = Object.values(this.modelDef.columns).filter(c => c.metadata?.visibility == 'common' && !includedNames.has(c.name))
        if (commonCols.length) {
            parent.h3('.centered.large-top-padding', h3 => {
                h3.span().text("Common Columns")
            })
            parent.table('.dd-table', table => {
                table.thead(thead => {
                    thead.tr(tr => {
                        tr.th().text("Name")
                        tr.th().text("Description")
                        tr.th().text("")
                    })
                })
                table.tbody(tbody => {
                    for (const colDef of commonCols) {
                        tbody.tr(tr => {
                            tr.td('.name').text(colDef.name)
                            tr.td('.description').text(colDef.metadata?.description || '')
                            tr.td().a('.add-column.tt-button.secondary.circle.inline', a => {
                                a.i('.glyp-plus')
                            }).emitClick(addSingleKey, {name: colDef.name})
                        })
                    }
                })
            })
        }

    }

    removeColumn(id: string) {
        const col = arrays.find(this.columnStates, c => c.id == id)
        if (col) {
            this.columnStates = arrays.without(this.columnStates, col)
            this.updateColumnEditors()
        }
    }

    async save() {
        const columns = this.columnStates.map(state => {
            return Objects.omit(state, 'schema', 'columnsEditor', 'id') as ColumnRef
        })
        const tableData = await this.tableFields.serialize()
        this.state.tableView.updateColumns(columns, tableData.prefix)
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
class ColumnEditor extends TerrierFormPart<ColumnState> {

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


////////////////////////////////////////////////////////////////////////////////
// Add Column Dropdown
////////////////////////////////////////////////////////////////////////////////

const checkAllKey = messages.untypedKey()
const applySelectionKey = messages.untypedKey()
const checkChangedKey = messages.typedKey<{column: string}>()

type SelectColumnsCallback = (columns: string[]) => any

/**
 * Shows a dropdown that allows the user to select one or more columns from the given model.
 */
class SelectColumnsDropdown extends Dropdown<{modelDef: ModelDef, callback: SelectColumnsCallback}> {

    checked: Set<string> = new Set()
    columns!: string[]

    get autoClose(): boolean {
        return true
    }

    async init() {
        await super.init()

        this.columns = Object.keys(this.state.modelDef.columns).sort()

        this.onClick(checkAllKey, _ => {
            // toggle them all being checked
            log.info(`${this.checked.size} of ${this.columns.length} checked`)
            if (this.checked.size > this.columns.length / 2) {
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
        parent.a('.header', a => {
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

        parent.a('.add', a => {
            a.i('.glyp-checkmark')
            a.span({text: "Add Selected"})
        }).emitClick(applySelectionKey)
    }

}


////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Columns = {
    render,
    functionType
}

export default Columns