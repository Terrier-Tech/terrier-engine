import {Part, PartTag} from "tuff-core/parts"
import Dates, {DateRange, VirtualDatePeriod, VirtualDateRange} from "./dates"
import {ColumnDef, ModelDef, SchemaDef} from "../../terrier/schema"
import {TableEditor, TableRef} from "./tables"
import {DdFormPart, DdModalPart} from "../dd-parts"
import {messages} from "tuff-core"
import {Logger} from "tuff-core/logging"
import Objects from "tuff-core/objects"
import inflection from "inflection"

const log = new Logger("Tables")

////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

type BaseFilter = {
    filter_type: string
    column: string
    editable?: 'optional' | 'required'
    edit_label?: string
}

export const DirectOperators = ['eq', 'ne', 'ilike'] as const
export type DirectOperator = typeof DirectOperators[number]

export type DirectFilter = BaseFilter & {
    filter_type: 'direct'
    operator: DirectOperator
    value: string
}

export type DateRangeFilter = BaseFilter & {
    filter_type: 'date_range'
    range: DateRange
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


////////////////////////////////////////////////////////////////////////////////
// Rendering
////////////////////////////////////////////////////////////////////////////////

function operatorDisplay(operator: DirectFilter['operator']): string {
    switch (operator) {
        case "eq":
            return '='
        case 'ne':
            return '!='
        case 'ilike':
            return 'like'
        default:
            return operator
    }
}


function render(parent: PartTag, filter: Filter) {
    switch (filter.filter_type) {
        case 'direct':
            parent.div('.column').text(filter.column)
            parent.div('.operator').text(operatorDisplay(filter.operator))
            parent.div('.value').text(filter.value)
            return
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
    tableEditor: TableEditor<TableRef>
}

const saveKey = messages.untypedKey()
const addKey = messages.untypedKey()
const removeKey = messages.typedKey<{ id: string }>()

export class FiltersEditorModal extends DdModalPart<FiltersEditorState> {

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
            id: `column-${this.filterCount}`, ...filter
        })
    }

    async init() {
        this.table = this.state.tableEditor.table
        this.modelDef = this.state.tableEditor.modelDef

        // initialize the filter states
        const filters = this.table.filters || []
        for (const filter of filters) {
            this.addState(filter)
        }
        this.updateFilterEditors()

        this.setTitle(`Filters for ${this.state.tableEditor.displayName}`)
        this.setIcon('glyp-filter')

        this.addAction({
            title: 'Apply',
            icon: 'glyp-checkmark',
            click: {key: saveKey}
        }, 'primary')

        this.addAction({
            title: 'Add Filter',
            icon: 'glyp-plus',
            click: {key: addKey}
        }, 'secondary')

        this.onClick(saveKey, _ => {
            this.save()
        })

        this.onClick(removeKey, _ => {
            // this.removeColumn(m.data.id)
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
        })
    }


    save() {
        const filters = this.filterStates.map(state => {
            return Objects.omit(state, 'schema', 'filtersEditor', 'id') as Filter
        })
        this.state.tableEditor.updateFilters(filters)
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

type FilterState = BaseFilterState<BaseFilter>

/**
 * Base class for editors for specific filter types.
 */
abstract class FilterEditor<T extends BaseFilter> extends DdFormPart<BaseFilterState<T>> {

    modelDef!: ModelDef
    columnDef?: ColumnDef

    async init() {
        this.modelDef = this.state.filtersEditor.modelDef
        this.columnDef = this.modelDef.columns[this.state.column]
    }

    get parentClasses(): Array<string> {
        return super.parentClasses.concat(['dd-editor-row'])
    }
}

/**
 * Contains a concrete instance of FilterEditor for the specific type of filter.
 */
class FilterEditorContainer extends Part<FilterState> {

    editor?: FilterEditor<any>

    async init() {
        switch (this.state.filter_type) {
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

    render(parent: PartTag) {
        parent.div('.column', col => {
            col.div('.tt-readonly-field', {text: this.state.column})
        })
        parent.div('.operator', col => {
            col.span().text("=")
        })
        parent.div('.filter', col => {
            this.textInput(col, 'value', {placeholder: "Value"})
        })
    }

}

////////////////////////////////////////////////////////////////////////////////
// Inclusion Editor
////////////////////////////////////////////////////////////////////////////////

const inclusionChangedKey = messages.typedKey<{value: string}>()

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
                col.div('.tt-flex.gap.wrap.possible-values', row => {
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
    }

}


////////////////////////////////////////////////////////////////////////////////
// Date Range Editor
////////////////////////////////////////////////////////////////////////////////

const dateRangeRelativeChangedKey = messages.untypedKey()
const dateRangePeriodChangedKey = messages.typedKey<{period: string}>()
const dateRangePreselectKey = messages.typedKey<VirtualDateRange>()

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
            cell.div('.tt-flex.gap', row => {
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
            cell.div('.tt-flex.gap.wrap', row => {
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
    }

}


////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Filters = {
    render
}

export default Filters