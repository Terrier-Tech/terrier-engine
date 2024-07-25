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
import Columns from "../queries/columns";
import Messages from "tuff-core/messages";

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
    y_axis: YAxisName
    style?: TraceStyle
    marker?: MarkerStyle
}

function blankTrace(): DivePlotTrace {
    return {
        id: Ids.makeUuid(),
        type: 'scatter',
        title: '',
        query_id: '',
        x: '',
        y: '',
        y_axis: 'left',
        style: {}
    }
}

export type DivePlotTraceState = DivePlotEditorState & {
    trace: DivePlotTrace
    onSave: (trace: DivePlotTrace) => any
}

export class DivePlotTraceEditor extends ModalPart<DivePlotTraceState> {

    fields!: TerrierFormFields<DivePlotTrace>
    queries: Query[] = []
    plot!: UnpersistedDdDivePlot
    trace!: DivePlotTrace

    queryOptions!: SelectOptions
    axisOptions: string[] = []

    saveKey = Messages.untypedKey()
    
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

        this.addAction({
            title: "Save",
            icon: "hub-checkmark",
            click: {key: this.saveKey}
        })

        this.onClick(this.saveKey, _ => {
            this.save()
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
        parent.div(".tt-form.tt-flex.gap.column.padded", mainColumn => {
            // query
            this.fields.compoundField(mainColumn, field => {
                field.label().text("Query")
                this.fields.select(field, 'query_id', this.queryOptions)
            })

            // axes
            mainColumn.div('.tt-flex.gap', row => {
                row.div('.tt-flex.column.gap', col => {
                    col.h4().text("X Column")
                    for (const c of this.axisOptions) {
                        this.fields.radioLabel(col, 'x', c, c)
                    }
                })
                row.div('.tt-flex.column.gap', col => {
                    col.h4().text("Y Column")
                    for (const c of this.axisOptions) {
                        this.fields.radioLabel(col, 'y', c, c)
                    }
                })
            })
        })
    }

    async save() {
        this.trace = await this.fields.serialize()
        log.debug("Saving plot trace", this.trace)
        this.state.onSave(this.trace)
        this.pop()
    }

}

export class DivePlotTraceRow extends TerrierFormPart<DivePlotTrace> {

    render(parent: PartTag) {
        const trace = this.state
        parent.div().text(`Plot Trace Row: ${trace.x} -> ${trace.y}`)
    }

}


const DivePlotTraces = {
    blankTrace
}
export default DivePlotTraces