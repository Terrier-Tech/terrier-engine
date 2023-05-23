import {Part, PartTag} from "tuff-core/parts"
import Dates, {DateRange} from "./dates"
import {ColumnDef, ModelDef, SchemaDef} from "../../terrier/schema"
import {TableEditor, TableRef} from "./tables"
import {DdFormPart, DdModalPart} from "../dd-parts"
import {messages} from "tuff-core"
import {Logger} from "tuff-core/logging"
import Objects from "tuff-core/objects"

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
            table.div('.dd-filter-editor-header', header => {
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

    get parentClasses(): Array<string> {
        return super.parentClasses.concat(['dd-filter-editor'])
    }

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

    get parentClasses(): Array<string> {
        return super.parentClasses.concat(['dd-filter-editor'])
    }

    render(parent: PartTag) {
        parent.div('.column', col => {
            col.div('.tt-readonly-field', {text: this.state.column})
        })
        parent.div('.operator', col => {
            col.span().text("IN")
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
// Export
////////////////////////////////////////////////////////////////////////////////

const Filters = {
    render
}

export default Filters