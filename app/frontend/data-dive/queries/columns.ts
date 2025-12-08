import { PartTag } from "tuff-core/parts"
import { ColumnDef, ModelDef, SchemaDef } from "../../terrier/schema"
import { TableRef, TableView } from "./tables"
import { Logger } from "tuff-core/logging"
import Forms, { FormFields, SelectOptions } from "tuff-core/forms"
import Objects from "tuff-core/objects"
import { ModalPart } from "../../terrier/modals"
import { Dropdown } from "../../terrier/dropdowns"
import DiveEditor from "../dives/dive-editor"
import Messages from "tuff-core/messages"
import Arrays from "tuff-core/arrays"
import Dom from "tuff-core/dom"
import Validation, { ColumnValidationError } from "./validation"
import Queries, { Query } from "./queries"
import { TerrierFormFields } from "../../terrier/forms"
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
    raw?: string
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
const addRawKey = Messages.untypedKey()
const addSingleKey = Messages.typedKey<{ name: string }>()
const removeKey = Messages.typedKey<{ id: string }>()
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


    async init() {
        this.table = this.state.tableView.table
        this.modelDef = this.state.tableView.modelDef

        this.tableFields = new FormFields(this, { ...this.table })

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
            click: { key: saveKey }
        }, 'primary')

        this.addAction({
            title: 'Add Columns',
            icon: 'glyp-plus',
            click: { key: addKey }
        }, 'secondary')

        this.addAction({
            title: 'Add Raw Select',
            icon: 'glyp-code_details',
            click: { key: addRawKey }
        }, 'secondary')

        this.onClick(saveKey, _ => {
            this.save()
        })

        this.onClick(removeKey, m => {
            this.removeEditor(m.data.id)
        })

        this.onClick(addSingleKey, m => {
            this.addColumn(m.data)
        })

        this.onClick(addKey, m => {
            this.toggleDropdown(SelectColumnsDropdown, { editor: this as ColumnsEditorModal }, m.event.target)
        })

        this.onClick(addRawKey, _ => {
            this.addRawColumn()
        })

        this.onChange(valueChangedKey, m => {
            log.info(`Column value changed`, m)
            this.validate().then()
        })
    }

    addColumn(col: ColumnRef) {
        log.info(`Add column ${col.name}`, col)
        this.addEditor(col)
        this.validate().then()
        this.dirty()
    }

    addRawColumn() {
        log.info(`Add raw column`)
        const colRef: ColumnRef = {
            name: ""
        }
        this.addEditor(colRef)
        this.validate().then()
        this.dirty()
    }

    addEditor(col: ColumnRef) {
        this.columnCount += 1
        const state = { schema: this.state.schema, columnsEditor: this, id: `column-${this.columnCount}`, column: col }
        this.columnEditors[state.id] = this.makePart(ColumnEditor, state)
    }

    removeEditor(id: string) {
        const editor = this.columnEditors[id]
        if (editor) {
            log.info(`Removing column ${id}`)
            this.removeChild(editor)
            delete this.columnEditors[id]
            this.validate().then()
        } else {
            log.warn(`No editor for column ${id}`)
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
                header.div('.name').label({ text: "Name" })
                header.div('.alias').label({ text: "Alias" })
                header.div('.function').label({ text: "Function" })
                header.div('.group-by').label({ text: "Group By?" })
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
                            }).emitClick(addSingleKey, { name: colDef.name })
                        })
                    }
                })
            })
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
        const tables = Queries.tables(query).
            filter(table => table._id == this.id)
        for (const table of tables) {
            table.columns = columns
            table.prefix = tableData.prefix
        }

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
    columnDef?: ColumnDef
    fields!: TerrierFormFields<ColumnRef>

    functionOptions!: SelectOptions

    async init() {
        this.schema = this.state.schema
        this.modelDef = this.state.columnsEditor.modelDef
        this.columnRef = this.state.column
        this.columnDef = this.modelDef.columns[this.columnRef.name]
        this.fields = new TerrierFormFields(this, this.columnRef)

        let funcs = Array.from<string>(AggFunctions)
        if (this.columnDef && (this.columnDef.type == 'date' || this.columnDef.type.includes('time'))) {
            funcs = funcs.concat(Array.from(DateFunctions))
        }
        this.functionOptions = Forms.titleizeOptions(funcs, '')
    }

    get parentClasses(): Array<string> {
        return super.parentClasses.concat(['dd-editor-row', 'tt-form'])
    }

    render(parent: PartTag) {
        if (this.columnDef) {
            this.renderColumnFields(parent)
        }
        else {
            this.renderRawFields(parent)
        }
        parent.div('.actions', actions => {
            actions.a(a => {
                a.i('.glyp-close')
            }).emitClick(removeKey, { id: this.state.id })
        })
        if (this.columnRef.errors?.length) {
            for (const error of this.columnRef.errors) {
                parent.div('.error.tt-bubble.alert').text(error.message)
            }
        }
    }

    /**
     * Render the fields for an actual column reference.
     * @param parent
     */
    renderColumnFields(parent: PartTag) {
        parent.div('.name', col => {
            col.div('.tt-readonly-field', { text: this.columnRef.name })
        })
        parent.div('.alias', col => {
            this.fields.textInput(col, "alias", { placeholder: "Alias" })
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
    }

    /**
     * Render the fields for a raw select statement.
     * @param parent
     */
    renderRawFields(parent: PartTag) {
        parent.div('.raw', col => {
            this.fields.textArea(col, "raw", { placeholder: "Raw SQL" })
        })
    }

    async serialize() {
        let formData = await this.fields.serialize()
        return Object.assign(this.fields.data, formData)
    }

}


////////////////////////////////////////////////////////////////////////////////
// Add Column Dropdown
////////////////////////////////////////////////////////////////////////////////

type SelectableColumn = {
    ref: ColumnRef
    def: ColumnDef
    included: boolean
    description: string
    sortOrder: string
}

/**
 * Shows a dropdown that allows the user to select one or more columns from the given model.
 */
class SelectColumnsDropdown extends Dropdown<{ editor: ColumnsEditorModal }> {

    addAllKey = Messages.untypedKey()
    addKey = Messages.typedKey<ColumnRef>()
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
        this.columns = Object.values(this.modelDef.columns).map(colDef => {
            const included = includedNames.has(colDef.name)
            const sortOrder = `${included ? '1' : '0'}${colDef.name}`
            const description = colDef.metadata?.description || ''
            return {
                def: colDef,
                ref: { name: colDef.name },
                included,
                sortOrder,
                description
            }
        })
        this.columns = Arrays.sortBy(this.columns, 'sortOrder')

        // add an option for a "count" column
        const idDef = this.modelDef.columns['id']
        if (idDef) {
            const countColumn: SelectableColumn = {
                def: idDef,
                ref: {
                    name: idDef.name,
                    alias: 'count',
                    function: 'count'
                },
                included: false,
                sortOrder: '',
                description: "Count all matching rows (when grouped)"
            }
            this.columns = this.columns.concat([countColumn])
        }

        this.onClick(this.addKey, m => {
            const colRef = m.data
            log.info(`Adding column ${colRef.name}`)
            this.state.editor.addColumn(colRef)

            // remove the link
            const link = Dom.queryAncestorClass(m.event.target as HTMLInputElement, 'column')
            link?.remove()
        })

        this.onClick(this.addAllKey, _ => {
            // add all the unincluded, non-function columns and close the dropdown
            for (const col of this.columns) {
                if (!col.included && !col.ref.function?.length) {
                    this.state.editor.addColumn(col.ref)
                }
            }
            this.clear()
        })
    }


    get parentClasses(): Array<string> {
        return super.parentClasses.concat(['tt-actions-dropdown']);
    }

    renderContent(parent: PartTag) {
        // keep track of the last column rendered to see if we need a separator
        let lastCol: SelectableColumn | null = null
        for (const col of this.columns) {
            const colRef = col.ref
            const colDef = col.def

            // add a separator if necessary
            if (lastCol) {
                if ((!lastCol.included && col.included)) {
                    parent.div('.separator')
                }
                if ((!lastCol.ref.function?.length && colRef.function?.length)) {
                    parent.div('.separator')
                }
            }

            // the actual link
            parent.a('.column', a => {
                if (colRef.function?.length) {
                    if (colRef.function == 'count') {
                        // no point showing the column name or type for count()
                        a.div('.name').text("count(*)")
                    }
                    else {
                        // non-count function, so show the type
                        a.div('.name').text(`${colRef.function}(${colDef.name})`)
                        a.div('.right-title').text(colDef.type)
                    }
                }
                else {
                    a.div('.name').text(colDef.name)
                    a.div('.right-title').text(colDef.type)
                }
                if (col.included) {
                    // style the columns that are already included differently
                    a.class('inactive')
                }
                if (col.description?.length) {
                    a.div('.subtitle').text(col.description)
                }
            }).emitClick(this.addKey, col.ref)
            lastCol = col
        }

        parent.a('.primary', a => {
            a.i('.glyp-check_all')
            a.span({ text: "Add All" })
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