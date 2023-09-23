import {Part, PartTag} from "tuff-core/parts"
import Dates, {DateLiteral, VirtualDatePeriod, VirtualDateRange} from "./dates"
import {ColumnDef, ModelDef, SchemaDef} from "../../terrier/schema"
import {TableRef, TableView} from "./tables"
import {Logger} from "tuff-core/logging"
import Objects from "tuff-core/objects"
import inflection from "inflection"
import {ModalPart} from "../../terrier/modals"
import TerrierFormPart from "../../terrier/parts/terrier-form-part"
import {Dropdown} from "../../terrier/dropdowns"
import dayjs from "dayjs"
import Format from "../../terrier/format"
import DiveEditor from "../dives/dive-editor"
import Messages from "tuff-core/messages"
import Arrays from "tuff-core/arrays"
import {SelectOptions} from "tuff-core/forms"

const log = new Logger("Filters")

////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

type BaseFilter = {
    filter_type: string
    column: string
    editable?: 'optional' | 'required'
    edit_label?: string
}

const directOperators = ['eq', 'ne', 'ilike', 'lt', 'gt', 'lte', 'gte'] as const
export type DirectOperator = typeof directOperators[number]

/**
 * Computes the operator options for the given column type.
 * @param type
 */
function operatorOptions(type: string): SelectOptions {
    let operators: DirectOperator[] = ['eq', 'ne'] // equality is the only thing we can assume for any type
    switch (type) {
        case 'text':
        case 'string':
            operators = ['eq', 'ne', 'ilike']
            break
        case 'float':
        case 'integer':
        case 'cents':
            operators = ['eq', 'ne', 'lt', 'gt', 'lte', 'gte']
            break
    }
    return operators.map(op => {
        return {
            value: op,
            title: operatorDisplay(op)
        }
    })
}

export type DirectFilter = BaseFilter & {
    filter_type: 'direct'
    operator: DirectOperator
    value: string
    numeric_value?: number
    column_type?: 'text' | 'number' | 'cents'
}

// type DirectColumnType = DirectFilter['column_type']

export type DateRangeFilter = BaseFilter & {
    filter_type: 'date_range'
    range: VirtualDateRange
}

export type InclusionFilter = BaseFilter & {
    filter_type: 'inclusion'
    in: string[]
}

// currently not implemented, but it would be neat
export type OrFilter = {
    column: 'or'
    filter_type: 'or'
    where: Filter[]
}

export type Filter = DirectFilter | DateRangeFilter | InclusionFilter | OrFilter

type FilterType = Filter['filter_type']


////////////////////////////////////////////////////////////////////////////////
// Rendering
////////////////////////////////////////////////////////////////////////////////

function operatorDisplay(op: DirectOperator): string {
    switch (op) {
        case 'eq':
            return '='
        case 'ne':
            return '≠'
        case 'ilike':
            return '≈'
        case 'lt':
            return '<'
        case 'lte':
            return '≤'
        case 'gt':
            return '>'
        case 'gte':
            return '≥'
        default:
            return '?'
    }
}


function renderStatic(parent: PartTag, filter: Filter) {
    switch (filter.filter_type) {
        case 'direct':
            parent.div('.column').text(filter.column)
            parent.div('.operator').text(operatorDisplay(filter.operator))
            switch (filter.column_type) {
                case 'cents':
                    parent.div('.value').text(Format.cents(filter.value))
                    break
                default:
                    parent.div('.value').text(filter.value)
                    break
            }
            break
        case 'date_range':
            parent.div('.column').text(filter.column)
            parent.div('.value').text(Dates.rangeDisplay(filter.range))
            return
        case 'inclusion':
            parent.div('.column').text(filter.column)
            parent.div('.operator').text("in")
            parent.div('.value').text(filter.in.join(' | '))
            return
        default:
            parent.div('.empty').text(`${filter.filter_type} filter`)
    }
}


////////////////////////////////////////////////////////////////////////////////
// Editor Modal
////////////////////////////////////////////////////////////////////////////////

export type FiltersEditorState = {
    schema: SchemaDef
    tableView: TableView<TableRef>
}

const saveKey = Messages.untypedKey()
const addKey = Messages.untypedKey()
const removeKey = Messages.typedKey<{ id: string }>()

export class FiltersEditorModal extends ModalPart<FiltersEditorState> {

    modelDef!: ModelDef
    table!: TableRef
    filterStates: FilterState[] = []
    filterCount = 0

    updateFilterEditors() {
        this.assignCollection('filters', FilterEditorContainer, this.filterStates)
    }

    addState(filter: Filter) {
        this.filterCount += 1
        this.filterStates.push({
            schema: this.state.schema,
            filtersEditor: this,
            id: `filter-${this.filterCount}`, ...filter
        })
    }

    async init() {
        this.table = this.state.tableView.table
        this.modelDef = this.state.tableView.modelDef

        // initialize the filter states
        const filters = this.table.filters || []
        for (const filter of filters) {
            this.addState(filter)
        }
        this.updateFilterEditors()

        this.setTitle(`Filters for ${this.state.tableView.displayName}`)
        this.setIcon('glyp-filter')

        this.addAction({
            title: 'Apply',
            icon: 'glyp-checkmark',
            click: {key: saveKey}
        }, 'primary')

        this.addAction({
            title: 'Add Filter',
            icon: 'glyp-plus_outline',
            classes: ['add-filter', 'secondary'],
            click: {key: addKey}
        }, 'secondary')

        this.onClick(saveKey, _ => {
            this.save()
        })

        this.onClick(removeKey, m => {
            this.removeFilter(m.data.id)
        })

        this.onClick(addKey, m => {
            this.showAddFilterDropdown(m.event.target! as HTMLElement)
        })
    }

    renderContent(parent: PartTag) {
        parent.div('.dd-filters-editor-table', table => {
            table.div('.dd-editor-header', header => {
                header.div('.column').label({text: "Column"})
                header.div('.operator').label({text: "Operator"})
                header.div('.filter').label({text: "Filter"})
            })
            this.renderCollection(table, 'filters')
                .class('dd-editor-row-container')
        })
    }

    removeFilter(id: string) {
        const filter = Arrays.find(this.filterStates, f => f.id == id)
        if (filter) {
            log.info(`Removing filter ${id}`, filter)
            this.filterStates = Arrays.without(this.filterStates, filter)
            this.updateFilterEditors()
        }
    }

    showAddFilterDropdown(target: HTMLElement | null) {
        const onSelected = (filter: Filter) => {
            log.info(`Adding ${filter.filter_type} filter`, filter)
            this.addState(filter)
            this.updateFilterEditors()
        }
        this.toggleDropdown(AddFilterDropdown, {modelDef: this.modelDef, callback: onSelected}, target)
    }

    update(elem: HTMLElement) {
        super.update(elem)

        // if there are no filters, show the dropdown right away
        if (this.filterStates.length == 0) {
            this.showAddFilterDropdown(null)
        }
    }

    save() {
        const filters = this.filterStates.map(state => {
            return Objects.omit(state, 'schema', 'filtersEditor', 'id') as Filter
        })
        this.state.tableView.updateFilters(filters)
        this.emitMessage(DiveEditor.diveChangedKey, {})
        this.pop()
    }

}


////////////////////////////////////////////////////////////////////////////////
// Base Editor
////////////////////////////////////////////////////////////////////////////////

type BaseFilterState<T extends BaseFilter> = T & {
    schema: SchemaDef
    filtersEditor: FiltersEditorModal
    id: string
}

type FilterState = BaseFilterState<Filter>

/**
 * Base class for editors for specific filter types.
 */
abstract class FilterEditor<T extends BaseFilter> extends TerrierFormPart<BaseFilterState<T>> {

    modelDef!: ModelDef
    columnDef?: ColumnDef

    async init() {
        this.modelDef = this.state.filtersEditor.modelDef
        this.columnDef = this.modelDef.columns[this.state.column]
    }

    get parentClasses(): Array<string> {
        return super.parentClasses.concat(['dd-editor-row'])
    }

    renderActions(row: PartTag) {
        row.div('.actions', actions => {
            actions.a(a => {
                a.i('.glyp-close')
            }).emitClick(removeKey, {id: this.state.id})
        })
    }
}

/**
 * Contains a concrete instance of FilterEditor for the specific type of filter.
 */
class FilterEditorContainer extends Part<FilterState> {

    editor?: FilterEditor<any>

    async init() {
        this.makeEditor(this.state.filter_type)
    }

    makeEditor(filterType: FilterType) {
        if (this.editor) {
            this.removeChild(this.editor)
        }
        switch (filterType) {
            case 'direct':
                this.editor = this.makePart(DirectFilterEditor, this.state as BaseFilterState<DirectFilter>)
                break
            case 'inclusion':
                this.editor = this.makePart(InclusionFilterEditor, this.state as BaseFilterState<InclusionFilter>)
                break
            case 'date_range':
                this.editor = this.makePart(DateRangeFilterEditor, this.state as BaseFilterState<DateRangeFilter>)
                break
        }
    }

    /**
     * This needs to be overridden because the state can be changed by the collection API,
     * in which case we need a new editor since it's dependent on the filter type.
     * @param state
     */
    assignState(state: FilterState): boolean {
        const changed = super.assignState(state)
        if (changed) {
            this.makeEditor(this.state.filter_type)
        }
        return changed
    }

    render(parent: PartTag) {
        if (this.editor) {
            parent.part(this.editor)
        }
        else {
            parent.div('.tt-bubble.alert', {text: `Unknown filter type '${this.state.filter_type}'`})
        }
    }

}

////////////////////////////////////////////////////////////////////////////////
// Direct Editor
////////////////////////////////////////////////////////////////////////////////

class DirectFilterEditor extends FilterEditor<DirectFilter> {

    numericChangeKey = Messages.untypedKey()

    async init() {
        await super.init()

        if (this.columnDef?.type == 'cents') {
            this.state.column_type = 'cents'
            this.state.numeric_value = parseInt(this.state.value) / 100
        }
        else if (this.columnDef?.type == 'number') {
            this.state.column_type = 'number'
            this.state.numeric_value = parseFloat(this.state.value)
        }

        // for numeric types, we use a number input and translate the
        // value back to the string value field whenever it changes
        this.onChange(this.numericChangeKey, m => {
            log.info(`Direct filter for ${this.columnDef?.name} numeric value changed to ${m.value}`)
            if (this.state.column_type == 'cents') {
                this.state.value = Math.round(parseFloat(m.value)*100).toString()
            }
            else {
                this.state.value = m.value
            }
        })
    }

    render(parent: PartTag) {
        parent.div('.column', col => {
            col.div('.tt-readonly-field', {text: this.state.column})
        })
        parent.div('.operator', col => {
            const opts = operatorOptions(this.columnDef?.type || 'text')
            this.select(col, 'operator', opts)
        })
        parent.div('.filter', col => {
            switch (this.state.column_type) {
                case 'cents':
                    col.div('.tt-compound-field', field => {
                        field.label().text('$')
                        this.numberInput(field, 'numeric_value', {placeholder: "Value"})
                            .emitChange(this.numericChangeKey)
                    })
                    break
                case 'number':
                    this.numberInput(col, 'numeric_value', {placeholder: "Value"})
                        .emitChange(this.numericChangeKey)
                    break
                default:
                    this.textInput(col, 'value', {placeholder: "Value"})
            }
        })
        this.renderActions(parent)
    }

}

////////////////////////////////////////////////////////////////////////////////
// Inclusion Editor
////////////////////////////////////////////////////////////////////////////////

const inclusionChangedKey = Messages.typedKey<{value: string}>()

class InclusionFilterEditor extends FilterEditor<InclusionFilter> {

    values!: Set<string>

    async init() {
        await super.init()

        this.values = new Set(this.state.in || [])
        this.onChange(inclusionChangedKey, m => {
            const val = m.data.value
            const checked = (m.event.target as HTMLInputElement).checked
            log.info(`${val} checkbox changed to ${checked}`)
            if (checked) {
                this.values.add(val)
            }
            else {
                this.values.delete(val)
            }
            this.state.in = Array.from(this.values)
        })
    }

    render(parent: PartTag) {
        parent.div('.column', col => {
            col.div('.tt-readonly-field', {text: this.state.column})
        })
        parent.div('.operator', col => {
            col.span().text("In")
        })
        parent.div('.filter', col => {
            if (this.columnDef?.possible_values?.length) {
                col.div('.tt-flex.gap.wrap.possible-values.align-center', row => {
                    for (const val of this.columnDef!.possible_values!) {
                        row.label('.body-size', label => {
                            label.input({type: 'checkbox', checked: this.values.has(val)})
                                .emitChange(inclusionChangedKey, {value: val})
                            label.div().text(val)
                        })
                    }
                })
            }
            else { // no possible values
                col.input({type: 'text', placeholder: "Values"})
            }
        })
        this.renderActions(parent)
    }

}


////////////////////////////////////////////////////////////////////////////////
// Date Range Editor
////////////////////////////////////////////////////////////////////////////////

const dateRangeRelativeChangedKey = Messages.untypedKey()
const dateRangePeriodChangedKey = Messages.typedKey<{period: string}>()
const dateRangePreselectKey = Messages.typedKey<VirtualDateRange>()

class DateRangeFilterEditor extends FilterEditor<DateRangeFilter> {

    range!: VirtualDateRange

    async init() {
        // assume it's a virtual range for the sake of editing it
        if ('period' in this.state.range) {
            this.range = this.state.range
        }
        else {
            // make up a new range
            this.range = {period: 'day', relative: -1}
            this.state.range = this.range
        }

        this.onChange(dateRangeRelativeChangedKey, m => {
            this.range.relative = parseFloat(m.value)
            this.dirty()
        })

        this.onChange(dateRangePeriodChangedKey, m => {
            log.info(`Date range period ${m.data.period} changed to ${m.value}`)
            this.range.period = m.data.period as VirtualDatePeriod
            this.dirty()
        })

        this.onClick(dateRangePreselectKey, m => {
            this.range = m.data
            this.state.range = this.range
            this.dirty()
        })
    }

    render(parent: PartTag) {
        parent.div('.column', col => {
            col.div('.tt-readonly-field', {text: this.state.column})
        })
        parent.div('.operator', col => {
            col.span().text("Range")
        })
        parent.div('.filter.column', cell => {

            // the actual inputs
            cell.div('.tt-flex.gap.align-center', row => {
                row.div('.shrink', col => {
                    col.input({type: 'number', value: this.range.relative.toString()})
                        .data({tooltip: "Positive for the future, zero for current, and negative for the past"})
                        .emitChange(dateRangeRelativeChangedKey)
                })
                row.div('.stretch.tt-flex.wrap.gap', col => {
                    for (const period of Dates.virtualPeriods) {
                        col.label('.caption-size', label => {
                            label.input({type: 'radio', name: `${this.id}-period`, value: period, checked: this.range.period==period})
                                .emitChange(dateRangePeriodChangedKey, {period})
                            label.span().text(inflection.titleize(period))
                        })
                    }
                })
            })

            // some common sets
            cell.div('.tt-flex.gap.wrap.align-center', row => {
                for (const period of Dates.virtualPeriods) {
                    row.div('.shrink', col => {
                        for (let relative = -1; relative < 2; relative++) {
                            const classes = ['date-range-preselect']
                            if (period == this.range.period && relative == this.range.relative) {
                                classes.push('current')
                            }
                            col.a().class(...classes)
                                .text(Dates.rangeDisplay({period, relative}))
                                .emitClick(dateRangePreselectKey, {period, relative})
                        }
                    })
                }
            })
        })

        this.renderActions(parent)
    }

}


////////////////////////////////////////////////////////////////////////////////
// Add Filter Dropdown
////////////////////////////////////////////////////////////////////////////////

type AddFilterCallback = (filter: Filter) => any

const columnSelectedKey = Messages.typedKey<{column: string}>()

class AddFilterDropdown extends Dropdown<{modelDef: ModelDef, callback: AddFilterCallback}> {
    columns!: ColumnDef[]

    get autoClose(): boolean {
        return true
    }

    async init() {
        await super.init()

        this.columns = Arrays.sortByFunction(Object.values(this.state.modelDef.columns), col => {
            const visibility = col.metadata?.visibility
            const sort = visibility == 'common' ? '0' : '1'
            return `${sort}${col.name}`
        })

        this.onClick(columnSelectedKey, m => {
            const column = m.data.column
            const colDef = this.state.modelDef.columns[column]
            if (colDef) {
                this.clear()
                switch (colDef.type) {
                    case 'enum':
                        const vals = colDef.possible_values || []
                        return this.state.callback({filter_type: 'inclusion', column, in: vals})
                    case 'date':
                    case 'datetime':
                        return this.state.callback({filter_type: 'date_range', column, range: {period: 'year', relative: 0}})
                    default: // direct
                        const colType = colDef.type == 'number' || colDef.type == 'cents' ? colDef.type : 'text'
                        return this.state.callback({filter_type: 'direct', column, column_type: colType, operator: 'eq', value: ''})
                }
            }
            else {
                this.showToast(`Invalid column ${column}`, {color: "alert"})
            }

        })
    }

    get parentClasses(): Array<string> {
        return super.parentClasses.concat(['tt-actions-dropdown'])
    }

    renderContent(parent: PartTag) {
        parent.div('.header', header => {
            header.i(".glyp-columns")
            header.span().text("Select a Column")
        })
        let showingCommon = true
        for (const column of this.columns) {
            const isCommon = column.metadata?.visibility == 'common'
            parent.a(a => {
                a.div('.title').text(column.name)
                const desc = column.metadata?.description
                if (desc?.length) {
                    a.div('.subtitle').text(desc)
                }

                // show a border between common and uncommon columns
                if (showingCommon && !isCommon) {
                    a.class('border-top')
                }
            }).emitClick(columnSelectedKey, {column: column.name})
            showingCommon = isCommon
        }
    }

}


////////////////////////////////////////////////////////////////////////////////
// Inputs
////////////////////////////////////////////////////////////////////////////////

export type FilterInput = Filter & {
    input_key: string
    input_value: string
    possible_values?: string[]
}

/**
 * Computes a string used to identify filters that are "the same".
 * @param schema
 * @param table
 * @param filter
 */
function toInput(schema: SchemaDef, table: TableRef, filter: Filter): FilterInput {
    const key = `${table.model}.${filter.column}`
    const filterInput: FilterInput = {input_key: key,...filter, input_value: ''}
    switch (filter.filter_type) {
        case 'inclusion':
            const modelDef = schema.models[table.model]
            const columnDef = modelDef.columns[filter.column]
            filterInput.possible_values = columnDef.possible_values
            filterInput.input_key = `${filterInput.input_key}#in`
            break
        case 'date_range':
            filterInput.input_key = `${filterInput.input_key}#range`
            break
        case 'direct':
            filterInput.input_key = `${filterInput.input_key}#${filter.operator}`
            break
    }
    return filterInput
}

/**
 * Populates a hash of raw field values used to track the value of the filter inputs.
 * @param filters
 * @return an object ready to be used in a `FormFields`
 */
function populateRawInputData(filters: FilterInput[]): Record<string,string> {
    const data: Record<string, string> = {}
    for (const filter of filters) {
        switch (filter.filter_type) {
            case 'date_range':
                const range = Dates.materializeVirtualRange(filter.range)
                data[`${filter.input_key}-min`] = range.min
                data[`${filter.input_key}-max`] = dayjs(range.max).subtract(1, 'day').format(Dates.literalFormat)
                break
            case 'direct':
                switch (filter.column_type) {
                    case 'cents':
                        data[filter.input_key] = (parseInt(filter.value)/100).toString()
                        break
                    default:
                        data[filter.input_key] = filter.value
                }
                break
            case 'inclusion':
                for (const value of filter.in) {
                    data[`${filter.input_key}-${value}`] = 'true'
                }
                break
            default:
                log.warn(`Don't know how to get ${filter.filter_type} raw value`, filter)
        }
    }
    return data
}

/**
 * Assign the input_value values for all filters based on the raw filter data that was populated with `populateRawInputData`.
 * This is necessary since some filter values need more than one form field to represent (like date range and inclusion).
 * @param filters
 * @param data
 */
function serializeRawInputData(filters: FilterInput[], data: Record<string, string>) {
    for (const filter of filters) {
        switch (filter.filter_type) {
            case 'date_range':
                const range = {
                    min: data[`${filter.input_key}-min`] as DateLiteral,
                    max: dayjs(data[`${filter.input_key}-max`]).add(1, 'day').format(Dates.literalFormat) as DateLiteral
                }
                const period = Dates.serializePeriod(range)
                filter.input_value = period
                break
            case 'direct':
                switch (filter.column_type) {
                    case 'cents':
                        const dollars = data[filter.input_key]
                        filter.input_value = Math.round(parseFloat(dollars)*100).toString()
                        break
                    default:
                        filter.input_value = data[filter.input_key]
                }
                break
            case 'inclusion':
                const values: string[] = []
                for (const value of filter.possible_values || []) {
                    if (data[`${filter.input_key}-${value}`]) {
                        values.push(value)
                    }
                }
                filter.input_value = values.join(',')
                break
            default:
                log.warn(`Don't know how to serialize ${filter.filter_type} raw value`, filter)
        }
    }
}




////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Filters = {
    renderStatic,
    toInput,
    operatorDisplay,
    populateRawInputData,
    serializeRawInputData
}

export default Filters