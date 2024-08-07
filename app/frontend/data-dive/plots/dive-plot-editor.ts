import { PartTag } from "tuff-core/parts"
import {ModalPart} from "../../terrier/modals"
import {DiveEditorState} from "../dives/dive-editor"
import {UnpersistedDdDivePlot} from "../gen/models"
import {TerrierFormFields} from "../../terrier/forms"
import Messages from "tuff-core/messages"
import {Logger} from "tuff-core/logging"
import DivePlotList from "./dive-plot-list"
import Db from "../dd-db"
import DivePlotRenderPart from "./dive-plot-render-part"
import {DivePlotAxis, DivePlotAxisFields} from "./dive-plot-axes"
import DivePlotTraces, {
    DivePlotTrace,
    DivePlotTraceEditor,
    DivePlotTraceRow,
} from "./dive-plot-traces"
import Fragments from "../../terrier/fragments"
import Arrays from "tuff-core/arrays"

const log = new Logger("DivePlotList")

export type DivePlotEditorState = DiveEditorState & {
    plot: UnpersistedDdDivePlot
}

export default class DivePlotEditor extends ModalPart<DivePlotEditorState> {

    plot!: UnpersistedDdDivePlot
    fields!: TerrierFormFields<UnpersistedDdDivePlot>

    leftAxisFields!: DivePlotAxisFields
    rightAxisFields!: DivePlotAxisFields
    bottomAxisFields!: DivePlotAxisFields

    newTraceKey = Messages.untypedKey()
    traces: DivePlotTrace[] = []

    renderPart!: DivePlotRenderPart
    saveKey = Messages.untypedKey()

    async init() {
        this.plot = this.state.plot

        if (this.plot.id?.length) {
            this.setTitle("Edit Dive Plot")
        }
        else {
            this.setTitle("New Dive Plot")
        }
        this.setIcon("glyp-differential")

        this.fields = new TerrierFormFields<UnpersistedDdDivePlot>(this, this.plot)

        // axis fields
        const axes = this.plot.layout.axes || {}
        const leftAxis: DivePlotAxis = axes['left'] || {type: 'number', title: ''}
        this.leftAxisFields = new DivePlotAxisFields(this, leftAxis, 'left')
        const rightAxis: DivePlotAxis = axes['right'] || {type: 'none', title: ''}
        this.rightAxisFields = new DivePlotAxisFields(this, rightAxis, 'right')
        const bottomAxis: DivePlotAxis = axes['bottom'] || {type: 'number', title: ''}
        this.bottomAxisFields = new DivePlotAxisFields(this, bottomAxis, 'bottom')

        // trace editors
        this.traces = this.plot.traces || []
        this.updateTraces()

        this.onClick(this.newTraceKey, _ => {
            log.info("Showing new trace form")
            const state = {
                ...this.state,
                trace: DivePlotTraces.blankTrace(),
                onSave: (newTrace: DivePlotTrace) => this.addTrace(newTrace),
                onDelete: (_: DivePlotTrace) => {}
            }
            this.app.showModal(DivePlotTraceEditor, state)
        })

        this.onClick(DivePlotTraces.editKey, m => {
            const id = m.data.id
            log.info(`Editing plot trace ${id}`)
            const trace = this.traces.find(t => t.id==id)
            if (trace) {
                const state = {
                    ...this.state,
                    trace,
                    onSave: (newTrace: DivePlotTrace) => this.replaceTrace(newTrace),
                    onDelete: (trace: DivePlotTrace) => this.removeTrace(trace),
                }
                this.app.showModal(DivePlotTraceEditor, state)
            }
        })

        this.renderPart = this.makePart(DivePlotRenderPart, this.state)

        this.addAction({
            title: "Save",
            icon: "hub-checkmark",
            click: {key: this.saveKey}
        })

        this.onClick(this.saveKey, _ => {
            log.debug("Saving plot", this.plot)
            this.save()
        })
    }

    addTrace(trace: DivePlotTrace) {
        this.traces.push(trace)
        this.updateTraces()
    }

    replaceTrace(trace: DivePlotTrace) {
        // TODO: implement this in tuff-core
        log.info(`Replacing trace ${trace.id}`, trace)
        this.traces = this.traces.map(t => t.id === trace.id ? trace : t)
        this.updateTraces()
    }

    removeTrace(trace: DivePlotTrace) {
        log.info(`Removing trace ${trace.id}`, trace)
        this.traces = Arrays.compact(this.traces.map(t => t.id === trace.id ? null : t))
        this.updateTraces()
    }

    updateTraces() {
        this.assignCollection('traces', DivePlotTraceRow, this.traces || [])
        this.dirty()
    }

    renderContent(parent: PartTag): void {
        parent.div(".tt-flex.column.padded.large-gap", mainColumn => {

            mainColumn.div(".dd-plot-axes-and-preview.tt-flex.column.gap", axesAndPreview => {
                this.fields.compoundField(axesAndPreview, field => {
                    field.label(".required").text("Title")
                    this.fields.textInput(field, 'title', {class: 'shrink plot-title'})
                }).class('plot-title-field')
                axesAndPreview.div('.tt-flex.gap', row => {
                    this.leftAxisFields.render(row)
                    row.part(this.renderPart)
                    this.rightAxisFields.render(row)
                })
                this.bottomAxisFields.render(axesAndPreview)
            })


            mainColumn.h3(".glyp-items").text("Traces")

            this.renderCollection(mainColumn, 'traces')

            mainColumn.div('.tt-flex.justify-center', row => {
                Fragments.button(row, this.theme, "New Trace", 'glyp-plus')
            }).emitClick(this.newTraceKey)
        })
    }

    async save() {
        const plotData = await this.fields.serialize()
        const plot = {...this.plot, title: plotData.title, traces: this.traces}

        plot.layout.axes = {
            left: await this.leftAxisFields.serialize(),
            bottom: await this.bottomAxisFields.serialize(),
            right: await this.rightAxisFields.serialize()
        }

        log.info("Saving plot", plot)

        const res = await Db().upsert('dd_dive_plot', plot)
        if (res.status == 'success') {
            this.state.plot = res.record
            this.emitMessage(DivePlotList.reloadKey, {})
            this.successToast("Successfully Saved Plot")
            return this.pop()
        }

        // errors
        log.warn("Error saving plot", res)
        this.alertToast(res.message)

    }
}


