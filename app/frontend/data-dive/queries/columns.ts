import {PartTag} from "tuff-core/parts"
import {ColumnDef, ModelDef, SchemaDef} from "../../terrier/schema"
import {TableRef, TableView} from "./tables"
import {Logger} from "tuff-core/logging"
import Forms, {FormFields, SelectOptions} from "tuff-core/forms"
import Objects from "tuff-core/objects"
import {ModalPart} from "../../terrier/modals"
import {Dropdown} from "../../terrier/dropdowns"
import DiveEditor from "../dives/dive-editor"
import Messages from "tuff-core/messages"
import Arrays from "tuff-core/arrays"
import Dom from "tuff-core/dom"
import Validation, {ColumnValidationError} from "./validation"
import Queries, {Query} from "./queries"
import {TerrierFormFields} from "../../terrier/forms"
import TerrierPart from "../../terrier/parts/terrier-part"

const log = new Logger("Columns")

////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

/**
 * Possible functions used to aggregate a column.
 */
const AggFunctions = ['count', 'sum', 'average', 'min', 'max'] as const

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
function functionType(fun: Function | undefined): 'aggregate' | 'time' | undefined {
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
    errors?: ColumnValidationError[]
}


/**
 * Computes the name of the resulting select clause.
 * @param table
 * @param col
 */
function computeSelectName(table: TableRef, col: ColumnRef): string {
    let name = col.name
    if (col.alias?.length) {
        name = col.alias
    }
    if (table.prefix?.length) {
        name = `${table.prefix}${name}`
    }
    return name
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
    query: Query
    tableView: TableView<TableRef>
}

const saveKey = Messages.untypedKey()
const addKey = Messages.untypedKey()
const addSingleKey = Messages.typedKey<{ name: string }>()
const removeKey = Messages.typedKey<{id: string}>()
const valueChangedKey = Messages.untypedKey()

/**
 * A modal that lets the user edit the columns being referenced for a particular table.
 */
export class ColumnsEditorModal extends ModalPart<ColumnsEditorState> {

    modelDef!: ModelDef
    table!: TableRef
    columnEditors: Record<string, ColumnEditor> = {}
    columnCount = 0

    tableFields!: FormFields<TableRef>

    addEditor(col: ColumnRef) {
        this.columnCount += 1
        const state = {schema: this.state.schema, columnsEditor: this, id: `column-${this.columnCount}`, column: col}
        this.columnEditors[state.id] = this.makePart(ColumnEditor, state)
    }


    async init () {
        this.table = this.state.tableView.table
        this.modelDef = this.state.tableView.modelDef

        this.tableFields = new FormFields(this, {...this.table})

        // initialize the columns states
        const columns: ColumnRef[] = this.table.columns || []
        for (const col of columns) {
            this.addEditor(col)
        }

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
            this.removeEditor(m.data.id)
        })

        this.onClick(addSingleKey, m => {
            this.addColumn(m.data.name)
        })

        this.onClick(addKey, m => {
            this.toggleDropdown(SelectColumnsDropdown, {editor: this as ColumnsEditorModal}, m.event.target)
        })

        this.onChange(valueChangedKey, m => {
            log.info(`Column value changed`, m)
            this.validate().then()
        })
    }

    addColumn(col: string) {
        const colDef = this.modelDef.columns[col]
        log.info(`Add column ${col}`, colDef)
        if (colDef) {
            this.addEditor({name: colDef.name})
            this.dirty()
        } else {
            alert(`Unknown column name '${col}'`)
        }
    }

    get currentEditorStates(): ColumnState[] {
        return Object.values(this.columnEditors).map(e => e.state)
    }

    get currentColumnNames(): Set<string> {
        const states = this.currentEditorStates
        return new Set(states.map(s => s.column.name))
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
            table.div('dd-editor-row-container', container => {
                for (const id of Object.keys(this.columnEditors)) {
                    container.part(this.columnEditors[id])
                }
            })
        })

        // common column quick links
        const includedNames = this.currentColumnNames
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
                            tr.td().a('.add-column.tt-button.secondary.circle.compact.inline', a => {
                                a.i('.glyp-plus')
                            }).emitClick(addSingleKey, {name: colDef.name})
                        })
                    }
                })
            })
        }

    }

    removeEditor(id: string) {
        const editor = this.columnEditors[id]
        if (editor) {
            log.info(`Removing column ${id}`)
            this.removeChild(editor)
            delete this.columnEditors[id]
        }
        else {
            log.warn(`No editor for column ${id}`)
        }
    }

    async serialize(): Promise<ColumnRef[]> {
        const editors = Object.values(this.columnEditors)
        return await Promise.all(editors.map(async part => {
            return await (part as ColumnEditor).serialize()
        }))
    }

    /**
     * Performs client-side validation against the current values in the editors.
     */
    async validate() {
        // serialize the columns and table settings
        const columns = await this.serialize()
        const tableData = await this.tableFields.serialize()

        // make a deep copy of the query and update this table's columns and settings
        this.table._id = this.id // we need this to identify the table after the deep copy
        const query = Objects.deepCopy(this.state.query)
        Queries.eachTable(query, table => {
            if (table._id == this.id) {
                table.columns = columns
                table.prefix = tableData.prefix
            }
        })

        // validate the temporary query
        log.info(`Validating temporary query with column changes`, query)
        Validation.validateQuery(query)

        // copy the column errors over
        const editors = Object.values(this.columnEditors)
        for (let i = 0; i < columns.length; i++) {
            editors[i].state.column.errors = columns[i].errors
        }

        this.dirty()
    }

    async save() {
        const columns = await this.serialize()
        const tableData = await this.tableFields.serialize()
        this.state.tableView.updateColumns(columns, tableData.prefix)
        this.emitMessage(DiveEditor.diveChangedKey, {})
        this.pop()
    }

}

type ColumnState = {
    schema: SchemaDef
    columnsEditor: ColumnsEditorModal
    id: string
    column: ColumnRef
}

/**
 * An editor row for an individual column.
 */
class ColumnEditor extends TerrierPart<ColumnState> {

    schema!: SchemaDef
    modelDef!: ModelDef
    columnRef!: ColumnRef
    columnDef!: ColumnDef
    fields!: TerrierFormFields<ColumnRef>

    functionOptions!: SelectOptions

    async init() {
        this.schema = this.state.schema
        this.modelDef = this.state.columnsEditor.modelDef
        this.columnRef = this.state.column
        this.columnDef = this.modelDef.columns[this.columnRef.name]
        this.fields = new TerrierFormFields(this, this.columnRef)

        let funcs = Array.from<string>(AggFunctions)
        if (this.columnDef.type == 'date' || this.columnDef.type.includes('time')) {
            funcs = funcs.concat(Array.from(DateFunctions))
        }
        this.functionOptions = Forms.titleizeOptions(funcs, '')
    }

    get parentClasses(): Array<string> {
        return super.parentClasses.concat(['dd-editor-row', 'tt-form'])
    }

    render(parent: PartTag) {
        parent.div('.name', col => {
            col.div('.tt-readonly-field', {text: this.columnRef.name})
        })
        parent.div('.alias', col => {
            this.fields.textInput(col, "alias", {placeholder: "Alias"})
                .emitChange(valueChangedKey)
        })
        parent.div('.function', col => {
            this.fields.select(col, "function", this.functionOptions)
                .emitChange(valueChangedKey)
        })
        parent.div('.group-by', col => {
            this.fields.checkbox(col, "grouped")
                .emitChange(valueChangedKey)
        })
        parent.div('.actions', actions => {
            actions.a(a => {
                a.i('.glyp-close')
            }).emitClick(removeKey, {id: this.state.id})
        })
        if (this.columnRef.errors?.length) {
            for (const error of this.columnRef.errors) {
                parent.div('.error.tt-bubble.alert').text(error.message)
            }
        }
    }

    async serialize() {
        return await this.fields.serialize()
    }
    
}


////////////////////////////////////////////////////////////////////////////////
// Add Column Dropdown
////////////////////////////////////////////////////////////////////////////////

type SelectableColumn = ColumnDef & {
    included: boolean
    sortOrder: string
}

/**
 * Shows a dropdown that allows the user to select one or more columns from the given model.
 */
class SelectColumnsDropdown extends Dropdown<{editor: ColumnsEditorModal}> {

    addAllKey = Messages.untypedKey()
    addKey = Messages.typedKey<{ name: string }>()
    checked: Set<string> = new Set()
    columns!: SelectableColumn[]
    modelDef!: ModelDef

    get autoClose(): boolean {
        return true
    }

    async init() {
        await super.init()

        this.modelDef = this.state.editor.modelDef

        // sort the columns by whether they're in the editor already
        const includedNames = this.state.editor.currentColumnNames
        this.columns = Object.values(this.modelDef.columns).map(col => {
            const included = includedNames.has(col.name)
            const sortOrder = `${included ? '1' : '0'}${col.name}`
            return {included, sortOrder,...col}
        })
        this.columns = Arrays.sortBy(this.columns, 'sortOrder')

        this.onClick(this.addKey, m => {
            log.info(`Adding column ${m.data.name}`)
            this.state.editor.addColumn(m.data.name)

            // remove the link
            const link = Dom.queryAncestorClass(m.event.target as HTMLInputElement, 'column')
            link?.remove()
        })

        this.onClick(this.addAllKey, _ => {
            // add all of the unincluded columns and close the dropdown
            for (const col of this.columns) {
                if (!col.included) {
                    this.state.editor.addColumn(col.name)
                }
            }
            this.clear()
        })
    }


    get parentClasses(): Array<string> {
        return super.parentClasses.concat(['tt-actions-dropdown']);
    }

    renderContent(parent: PartTag) {
        for (const col of this.columns) {
            parent.a('.column', a => {
                a.div('.name').text(col.name)
                a.div('.right-title').text(col.type)
                if (col.included) {
                    // style the columns that are already included differently
                    a.class('inactive')
                }
                if (col.metadata?.description?.length) {
                    a.div('.subtitle').text(col.metadata.description)
                }
            }).emitClick(this.addKey, {name: col.name})
        }

        parent.a('.primary', a => {
            a.i('.glyp-check_all')
            a.span({text: "Add All"})
        }).emitClick(this.addAllKey)
    }

}


////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Columns = {
    render,
    functionType,
    computeSelectName
}

export default Columns