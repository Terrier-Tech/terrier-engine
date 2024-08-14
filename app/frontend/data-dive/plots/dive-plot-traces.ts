import {MarkerStyle, PlotTrace, TraceType, YAxisName} from "tuff-plot/trace"
import { PartTag } from "tuff-core/parts"
import {ModalPart} from "../../terrier/modals"
import Ids from "../../terrier/ids"
import {DivePlotEditorState} from "./dive-plot-editor"
import {TerrierFormFields} from "../../terrier/forms"
import {UnpersistedDdDivePlot} from "../gen/models"
import {SelectOptions} from "tuff-core/forms"
import Queries, {Query, QueryResult} from "../queries/queries"
import {Logger} from "tuff-core/logging"
import Columns from "../queries/columns"
import Messages from "tuff-core/messages"
import DivePlotStyles, {DivePlotTraceStyle, TraceStyleFields} from "./dive-plot-styles"
import TerrierPart from "../../terrier/parts/terrier-part"

const log = new Logger("DivePlotTraces")

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
    style?: DivePlotTraceStyle
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
        style: DivePlotStyles.blankStyle(),
    }
}



/// Editor

export type DivePlotTraceEditorState = DivePlotEditorState & {
    trace: DivePlotTrace
    onSave: (trace: DivePlotTrace) => any
    onDelete: (trace: DivePlotTrace) => any
}

const editKey = Messages.typedKey<{ id: string }>()

/**
 * Editor for a single plot trace.
 */
export class DivePlotTraceEditor extends ModalPart<DivePlotTraceEditorState> {

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
        this.trace.yAxis ||= 'left'

        this.queries = this.state.dive.query_data?.queries || []
        this.queryOptions = this.queries.map(query => {
            return {value: query.id, title: query.name}
        }) || []

        this.trace.query_id ||= this.queries.at(0)?.id || ''
        this.updateAxisOptions(this.trace.query_id)

        this.fields = new TerrierFormFields<DivePlotTrace>(this, this.state.trace)

        this.trace.style ||= DivePlotStyles.blankStyle()
        this.styleFields = new TraceStyleFields(this, this.trace.style)

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
            mainColumn.div('.tt-flex.gap', row => {
                // query
                this.fields.compoundField(row, field => {
                    field.label().text("Query")
                    this.fields.select(field, 'query_id', this.queryOptions)
                })
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
                row.div('.tt-flex.column.gap', col => {
                    col.h3().text("Y Axis")
                    this.fields.radioLabel(col, 'yAxis', 'left', 'Left')
                    this.fields.radioLabel(col, 'yAxis', 'right', 'Right')
                })
            })

            // style
            this.styleFields.render(mainColumn)
        })
    }

    async save() {
        const data = await this.fields.serialize()
        this.trace = {...this.trace, ...data}
        this.trace.style = await this.styleFields.serialize()
        log.info("Saving plot trace", this.trace)
        this.state.onSave(this.trace)
        this.pop()
    }

}


/// Row


export type DivePlotTraceRowState = DivePlotEditorState & {
    trace: DivePlotTrace
    index: number // keep track of which row is being rendered so we can choose the default color
}


/**
 * Row for displaying a single plot trace.
 */
export class DivePlotTraceRow extends TerrierPart<DivePlotTraceRowState> {

    render(parent: PartTag) {
        const trace = this.state.trace
        const style = trace.style || DivePlotStyles.blankStyle()
        const query = this.state.dive.query_data?.queries.find(q => q.id == trace.query_id)
        parent.a('.dd-dive-plot-trace-row.tt-panel.padded', panel => {
            panel.div('.tt-flex.row.gap.align-center', content => {
                // query
                if (query) {
                    content.div('.glyp-query.with-icon').text(query.name)
                }
                else {
                    content.div('.glyp-query.alert.with-icon').text("Unknown Query")
                }

                // axes
                content.div('.axes').text(`${trace.x} -> ${trace.y}`)

                // style
                content.div('.style', stylePreview => {
                    DivePlotStyles.renderPreview(stylePreview, style, this.state.index)
                }).data({tooltip: `${style.colorName} ${style.strokeWidthName} ${style.strokeDasharrayName}`})
            })
        }).emitClick(editKey, {id: trace.id})
    }

}


/// Conversion

function toPlotTrace(diveTrace: DivePlotTrace, queryResult: QueryResult): PlotTrace<any> {
    return {
        type: diveTrace.type,
        title: diveTrace.title,
        data: queryResult.rows || [],
        x: diveTrace.x,
        y: diveTrace.y,
        yAxis: diveTrace.yAxis || 'left',
        style: DivePlotStyles.toTraceStyle(diveTrace.style || DivePlotStyles.blankStyle()),
        marker: diveTrace.marker
    }
}


/// Export

const DivePlotTraces = {
    blankTrace,
    editKey,
    toPlotTrace
}
export default DivePlotTraces