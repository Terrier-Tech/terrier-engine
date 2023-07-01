import {ModalPart} from "../../terrier/modals"
import {PartTag} from "tuff-core/parts"
import {DdDive, DdDiveRun, UnpersistedDdDiveRun} from "../gen/models"
import Db from "../dd-db"
import Api, {ErrorEvent} from "../../terrier/api"
import {Query} from "../queries/queries"
import {DivTag} from "tuff-core/html"
import {messages} from "tuff-core"
import {IconName} from "../../terrier/theme"
import Filters, {FilterInput} from "../queries/filters"
import Dives from "./dives"
import Dates from "../queries/dates";
import {Logger} from "tuff-core/logging";
import Schema, {SchemaDef} from "../../terrier/schema"

const log = new Logger("DiveRuns")

type RunQueryResult = {
    id: string
    time: string
    status: 'pending' | 'success' | 'error'
    message?: string
}

const statusIcons: Record<RunQueryResult['status'], IconName> = {
    pending: 'glyp-pending',
    success: 'glyp-complete',
    error: 'glyp-alert'
}

type RunFileOutput = {
    name: string
    size: number
    url: string
}

export class DiveRunModal extends ModalPart<{dive: DdDive }> {

    schema!: SchemaDef
    filters!: FilterInput[]
    run?: DdDiveRun
    inputs: Record<string, string> = {}
    error?: ErrorEvent
    fileOutput?: RunFileOutput
    queryResults: Record<string, RunQueryResult> = {}

    startKey = messages.untypedKey()

    async init() {
        this.setTitle("Run Dive")
        this.setIcon('glyp-play')

        this.schema = await Schema.get()

        // initialize the inputs
        this.filters = Dives.computeFilterInputs(this.schema, this.state.dive)
        for (const filter of this.filters) {
            switch (filter.filter_type) {
                case 'date_range':
                    const range = Dates.materializeVirtualRange(filter.range)
                    this.inputs[filter.key] = Dates.serializePeriod(range)
                    break
                case 'direct':
                    this.inputs[filter.key] = filter.value
                    break
                case 'inclusion':
                    this.inputs[filter.key] = filter.in.join(',')
                    break
                default:
                    log.warn(`Don't know how to initialize ${filter.filter_type} value`, filter)
            }
        }

        this.addAction({
            title: "Run",
            icon: 'glyp-play',
            click: {key: this.startKey}
        })

        this.onClick(this.startKey, _ => {
            this.createRun()
        })

        this.dirty()
    }

    async createRun() {
        const newRun: UnpersistedDdDiveRun = {
            dd_dive_id: this.state.dive.id,
            status: 'initial'
        }
        const res = await Db().upsert('dd_dive_run', newRun)
        if (res.status == 'success' && res.record) {
            this.beginStreaming(res.record)
        } else {
            this.alertToast(`Error creating dive run: ${res.message}`)
        }
        this.dirty()
    }

    beginStreaming(run: DdDiveRun) {
        this.run = run
        Api.stream(`/data_dive/stream_run/${this.run.id}`)
            .on<RunQueryResult>('query_result', res => {
                this.queryResults[res.id] = res
                this.dirty()
            })
            .on<RunFileOutput>('file_output', res => {
                this.fileOutput = res
                this.dirty()
            })
            .onError(evt => {
                this.error = evt
                this.dirty()
            })
    }


    renderContent(parent: PartTag): void {
        parent.div('.tt-flex.collapsible.padded.gap.tt-form', row => {
            // inputs
            row.div('.tt-flex.column.large-gap.shrink', col => {
                for (const filter of this.filters) {
                    const val = this.inputs[filter.key]
                    Filters.renderInput(col, filter, val)
                }
            })
            
            // output
            row.div('.dd-dive-run-output', col => {
                // error
                if (this.error) {
                    col.div('.tt-bubble.alert', bubble => {
                        const error = this.error!
                        bubble.div('.message').text(error.message)
                        if (error.backtrace?.length) {
                            bubble.div('.backtrace', backtrace => {
                                for (const line of error.backtrace) {
                                    backtrace.div('.line').text(line)
                                }
                            })
                        }
                    })
                    return
                }

                // queries
                for (const query of this.state.dive.query_data?.queries || []) {
                    this.renderQuery(col, query)
                }

                // output
                if (this.fileOutput) {
                    this.renderFileOutput(col, this.fileOutput)
                }
            })
        })
    }

    renderQuery(parent: DivTag, query: Query) {
        const res = this.queryResults[query.id]
        const status = res?.status || 'pending'

        parent.div('.query-run', status, row => {
            row.i(statusIcons[status])
            row.div('.name').text(query.name)
            if (res?.status == 'error') {
                row.div('.tt-bubble.alert').text(res.message || "Error!")
            }
            else if (res?.message?.length) {
                row.div('.details').text(res.message)
            }
        })
    }

    renderFileOutput(parent: DivTag, fileOutput: RunFileOutput) {
        parent.a('.file-output', {href: fileOutput.url}, row => {
            row.i('.glyp-file_spreadsheet')
            row.div('.name').text(fileOutput.name)
            row.div('.details.glyp-download').text("Click to download")
        })
    }

}