import {ModalPart} from "../../terrier/modals"
import {PartTag} from "tuff-core/parts"
import {DdDive, DdDiveRun, UnpersistedDdDiveRun} from "../gen/models"
import Db from "../dd-db"
import Api, {ErrorEvent} from "../../terrier/api"
import {Query} from "../queries/queries"
import {DivTag, HtmlParentTag} from "tuff-core/html"
import {messages} from "tuff-core"
import {IconName} from "../../terrier/theme"
import Filters, {DateRangeFilter, DirectFilter, FilterInput, InclusionFilter} from "../queries/filters"
import Dives from "./dives"
import {Logger} from "tuff-core/logging";
import Schema, {SchemaDef} from "../../terrier/schema"
import {TerrierFormFields} from "../../terrier/forms"
import inflection from "inflection"

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
    error?: ErrorEvent
    inputFields!: TerrierFormFields<any>
    fileOutput?: RunFileOutput
    queryResults: Record<string, RunQueryResult> = {}

    startKey = messages.untypedKey()

    async init() {
        this.setTitle("Run Dive")
        this.setIcon('glyp-play')

        this.schema = await Schema.get()

        // initialize the inputs
        this.filters = Dives.computeFilterInputs(this.schema, this.state.dive)
        const rawInputs = Filters.populateRawInputData(this.filters)
        this.inputFields = new TerrierFormFields<any>(this, rawInputs)

        this.listen('datachanged', this.inputFields.dataChangedKey, _ => {
            this.updateFilters().then()
        })
        await this.updateFilters()

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

    async updateFilters() {
        const raw = await this.inputFields.serialize()
        Filters.serializeRawInputData(this.filters, raw)
        log.info(`Raw and serialized input data`, raw, this.filters)
        log.info(`Filter input data:`, this.inputFields.data)
    }

    async createRun() {
        const newRun: UnpersistedDdDiveRun = {
            dd_dive_id: this.state.dive.id,
            status: 'initial',
            input_data: {
                filters: this.filters,
                ...this.state.dive.query_data!
            }
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
            row.div('.tt-flex.column.shrink.dd-dive-run-inputs', col => {
                for (const filter of this.filters) {
                    this.renderInput(col, filter)
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

    renderInput(parent: HtmlParentTag, filter: FilterInput) {
        parent.div('.dd-dive-run-input', col => {
            // don't show anything after the # and replace periods with spaces
            const title = inflection.titleize(filter.input_key.split('#')[0].split('.').join(' '))
            col.label('.caption-size').text(title)
            switch (filter.filter_type) {
                case 'direct':
                    return this.renderDirectInput(col, filter)
                case 'date_range':
                    return this.renderDateRangeInput(col, filter)
                case 'inclusion':
                    return this.renderInclusionInput(col, filter)
                default:
                    col.p().text(`Don't know how to render input for ${filter.filter_type} filter`)
            }
        })
    }

    renderDirectInput(parent: HtmlParentTag, filter: DirectFilter & FilterInput) {
        parent.div('.tt-compound-field', field => {
            field.label().text(Filters.operatorDisplay(filter.operator))
            this.inputFields.textInput(field, filter.input_key)
        })
    }

    renderDateRangeInput(parent: HtmlParentTag, filter: DateRangeFilter & FilterInput) {
        parent.div('.tt-compound-field', field => {
            this.inputFields.dateInput(field, `${filter.input_key}-min`)
            field.label().text('→')
            this.inputFields.dateInput(field, `${filter.input_key}-max`)
        })
    }

    renderInclusionInput(parent: HtmlParentTag, filter: InclusionFilter & FilterInput) {
        parent.div('.inclusion-radios', container => {
            for (const possible of filter.possible_values || []) {
                container.label('.body-size', label => {
                    this.inputFields.checkbox(label, `${filter.input_key}-${possible}`)
                    label.span().text(inflection.titleize(possible))
                })
            }
        })
    }

}