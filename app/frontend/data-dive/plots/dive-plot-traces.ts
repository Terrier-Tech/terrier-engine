import {MarkerStyle, TraceStyle, TraceType, YAxisName} from "tuff-plot/trace"
import TerrierFormPart from "../../terrier/parts/terrier-form-part"
import { PartTag } from "tuff-core/parts"
import {ModalPart} from "../../terrier/modals"
import Ids from "../../terrier/ids"
import {DivePlotEditorState} from "./dive-plot-editor"
import {TerrierFormFields} from "../../terrier/forms"
import {UnpersistedDdDivePlot} from "../gen/models"
import {SelectOptions} from "tuff-core/forms"
import Queries, {Query} from "../queries/queries"
import {Logger} from "tuff-core/logging"
import Columns from "../queries/columns"
import Messages from "tuff-core/messages"
import {ColorName, TraceStyleFields} from "./dive-plot-styles"

const log = new Logger("DivePlotTraces")


export type DivePlotTraceStyle = TraceStyle & {
    colorName: ColorName | "default"
}

/**
 * Similar to the tuff-plot Trace but not strongly typed to the data type since it's dynamically assigned to a query.
 */
export type DivePlotTrace = {
    id: string
    type: TraceType
    title: string
    query_id: string
    x: string
    y: string
    yAxis: YAxisName
    style?: TraceStyle
    marker?: MarkerStyle
}

/**
 * Create a new blank trace.
 */
function blankTrace(): DivePlotTrace {
    return {
        id: Ids.makeUuid(),
        type: 'scatter',
        title: '',
        query_id: '',
        x: '',
        y: '',
        yAxis: 'left',
        style: {}
    }
}



/// Editor

export type DivePlotTraceState = DivePlotEditorState & {
    trace: DivePlotTrace
    onSave: (trace: DivePlotTrace) => any
    onDelete: (trace: DivePlotTrace) => any
}

const editKey = Messages.typedKey<{ id: string }>()

/**
 * Editor for a single plot trace.
 */
export class DivePlotTraceEditor extends ModalPart<DivePlotTraceState> {

    fields!: TerrierFormFields<DivePlotTrace>
    queries: Query[] = []
    plot!: UnpersistedDdDivePlot
    trace!: DivePlotTrace

    queryOptions!: SelectOptions
    axisOptions: string[] = []

    styleFields!: TraceStyleFields

    saveKey = Messages.untypedKey()
    deleteKey = Messages.untypedKey()

    async init() {
        this.setTitle("Plot Trace Editor")
        this.setIcon("glyp-items")

        this.plot = this.state.plot
        this.trace = this.state.trace

        this.queries = this.state.dive.query_data?.queries || []
        this.queryOptions = this.queries.map(query => {
            return {value: query.id, title: query.name}
        }) || []

        this.trace.query_id ||= this.queries.at(0)?.id || ''
        this.updateAxisOptions(this.trace.query_id)

        this.fields = new TerrierFormFields<DivePlotTrace>(this, this.state.trace)

        this.styleFields = new TraceStyleFields(this, this.trace.style || {})

        this.addAction({
            title: "Save",
            icon: "glyp-checkmark",
            click: {key: this.saveKey}
        })

        this.addAction({
            title: "Delete",
            icon: "glyp-delete",
            click: {key: this.deleteKey},
            classes: ['alert']
        }, 'secondary')

        this.onClick(this.saveKey, _ => {
            this.save()
        })

        this.onClick(this.deleteKey, _ => {
            this.state.onDelete(this.trace)
            this.pop()
        })
    }

    /**
     * Update the axis options based on the query.
     */
    updateAxisOptions(queryId: string) {
        const query = this.queries.find(q => q.id == queryId)
        this.axisOptions = []
        if (query) {
            log.info(`Computing axis options for query`, query)
            Queries.eachColumn(query, (table, column) => {
                this.axisOptions.push(Columns.computeSelectName(table, column))
            })
        }
        else {
            log.warn(`No query with id ${queryId}`)
        }
        this.dirty()
    }

    renderContent(parent: PartTag): void {
        parent.div(".tt-form.tt-flex.large-gap.column.padded", mainColumn => {
            // query
            this.fields.compoundField(mainColumn, field => {
                field.label().text("Query")
                this.fields.select(field, 'query_id', this.queryOptions)
            })

            // axes
            mainColumn.div('.tt-flex.gap', row => {
                row.div('.tt-flex.column.gap', col => {
                    col.h3().text("X Column")
                    for (const c of this.axisOptions) {
                        this.fields.radioLabel(col, 'x', c, c)
                    }
                })
                row.div('.tt-flex.column.gap', col => {
                    col.h3().text("Y Column")
                    for (const c of this.axisOptions) {
                        this.fields.radioLabel(col, 'y', c, c)
                    }
                })
            })

            // style
            mainColumn.div('.tt-flex.gap.column', styleRow => {
                styleRow.h3().text("Style")
                this.styleFields.render(styleRow)
            })
        })
    }

    async save() {
        const data = await this.fields.serialize()
        this.trace = {...this.trace, ...data}
        log.info("Saving plot trace", this.trace)
        this.state.onSave(this.trace)
        this.pop()
    }

}


/// Row

/**
 * Row for displaying a single plot trace.
 */
export class DivePlotTraceRow extends TerrierFormPart<DivePlotTrace> {

    render(parent: PartTag) {
        const trace = this.state
        parent.a('.dd-dive-plot-trace-row.tt-panel.padded', panel => {
            panel.div('.panel-content.tt-flex.row.gap', content => {
                content.div('.axes').text(`${trace.x} -> ${trace.y}`)
            })
        }).emitClick(editKey, {id: trace.id})
    }

}


/// Export

const DivePlotTraces = {
    blankTrace,
    editKey
}
export default DivePlotTraces