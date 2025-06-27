import Arrays from "tuff-core/arrays"
import {ModalPart} from "../../terrier/modals"
import {PartTag} from "tuff-core/parts"
import {DdDive, DdDiveRun, UnpersistedDdDiveRun} from "../gen/models"
import Db from "../dd-db"
import Api from "../../terrier/api"
import {ErrorEvent} from "../../terrier/api-subscriber"
import {Query} from "../queries/queries"
import {DivTag, HtmlParentTag} from "tuff-core/html"
import {IconName} from "../../terrier/theme"
import Filters, {DateRangeFilter, DirectFilter, FilterInput, InclusionFilter} from "../queries/filters"
import Dives from "./dives"
import {Logger} from "tuff-core/logging";
import Schema, {SchemaDef} from "../../terrier/schema"
import {TerrierFormFields} from "../../terrier/forms"
import * as inflection from "inflection"
import Dates, {DateLiteral, DatePeriodPickerPart, DatePeriodPickerState, LiteralDateRange} from "../queries/dates"
import dayjs from "dayjs"
import {ProgressBarPart} from "../../terrier/progress"
import {LogListPart} from "../../terrier/logging"
import Messages from "tuff-core/messages"
import Format from "../../terrier/format"

const log = new Logger("DiveRuns")


////////////////////////////////////////////////////////////////////////////////
// Run Modal
////////////////////////////////////////////////////////////////////////////////

type RunQueryResult = {
    id: string
    time: string
    status: 'pending' | 'success' | 'error'
    message?: string
}

type InitRunResult = {
    total_steps: number
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
    progressBar!: ProgressBarPart
    logList!: LogListPart

    startKey = Messages.untypedKey()
    pickDateKey = Messages.typedKey<{ id: string }>()

    async init() {
        this.setTitle("Run Dive")
        this.setIcon('glyp-play')

        this.schema = await Schema.get()

        this.progressBar = this.makePart(ProgressBarPart, {total: 10})
        this.logList = this.makePart(LogListPart, {})

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
            this.startActionLoading()
            this.createRun()
        })

        this.onClick(this.pickDateKey, m => {
            const initialRange = {
                min: this.inputFields.data[`${m.data.id}-min`] as DateLiteral,
                max: dayjs(this.inputFields.data[`${m.data.id}-max`]).add(1, 'day').format(Dates.literalFormat) as DateLiteral
            } as LiteralDateRange
            this.toggleDropdown(DatePeriodPickerPart, {
                initial: initialRange,
                callback: (newRange: LiteralDateRange) => {
                    log.info(`Picked date range for ${m.data.id}`, newRange)
                    this.inputFields.data[`${m.data.id}-min`] = newRange.min
                    this.inputFields.data[`${m.data.id}-max`] = dayjs(newRange.max).subtract(1, 'day').format(Dates.literalFormat)
                    this.dirty()
                }} as DatePeriodPickerState,
                m.event.target
            )
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
        this.progressBar.setProgress(0, 'primary')
        await this.updateFilters()
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
            this.logList.info(`Created dive run`)
        } else {
            this.alertToast(`Error creating dive run: ${res.message}`)
        }
        this.progressBar.increment()
        this.dirty()
    }

    beginStreaming(run: DdDiveRun) {
        this.run = run
        Api.stream(`/data_dive/stream_run/${this.run.id}`)
            .on<InitRunResult>('init_run', res => {
                this.progressBar.setTotal(res.total_steps)
                this.logList.clear()
                log.info(`Total steps for run: ${res.total_steps}`)
                this.dirty()
            })
            .on<RunQueryResult>('query_result', res => {
                this.queryResults[res.id] = res
                this.progressBar.increment()
                this.dirty()
            })
            .on<RunFileOutput>('file_output', res => {
                this.fileOutput = res
                this.stopActionLoading()
                this.progressBar.complete('success')
                this.dirty()
            })
            .onLog(evt => {
                this.progressBar.increment()
                log.log(evt.level, evt.message)
                this.logList.push(evt)
                this.dirty()
            })
            .onError(evt => {
                this.error = evt
                this.stopActionLoading()
                this.progressBar.complete('alert')
                this.dirty()
            })
            .onClose(() => {
                this.stopActionLoading()
                this.dirty()
            })
    }

    get contentClasses() {
        return ['padded', ...super.contentClasses]
    }

    renderContent(parent: PartTag): void {
        parent.div('.tt-flex.gap.column', col => {
            col.part(this.progressBar)

            // inputs and outputs row
            col.div('.tt-flex.collapsible.gap.tt-form', row => {
                // inputs
                row.div('.tt-flex.column.dd-dive-run-inputs', col => {
                    const filtersByQuery = Arrays.groupBy(this.filters, 'query_name')
                    for (const queryName of Object.keys(filtersByQuery).sort()) {
                        col.h3(".glyp-data_dive_query").text(queryName)
                        for (const filter of filtersByQuery[queryName]) {
                            this.renderInput(col, filter)
                        }
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

            // log
            col.part(this.logList)
        })
    }

    renderQuery(parent: DivTag, query: Query) {
        const res = this.queryResults[query.id]
        const status = res?.status || 'pending'

        parent.div('.query-run', status, runView => {
            runView.div('.tt-flex.gap.align-center', row => {
                row.i(statusIcons[status])
                row.div('.name').text(query.name)
            })
            if (res?.status == 'error') {
                runView.div('.tt-bubble.alert').text(res.message || "Error!")
            }
            else if (res?.message?.length) {
                runView.div('.details').text(res.message)
            }
        })
    }

    renderFileOutput(parent: DivTag, fileOutput: RunFileOutput) {
        parent.a('.file-output', { href: fileOutput.url, download: fileOutput.name }, row => {
            row.div('.name.glyp-file_spreadsheet.with-icon').text(fileOutput.name)
            row.div('.details.glyp-download.with-icon').text("Click to download")
        })
    }

    renderInput(parent: HtmlParentTag, filter: FilterInput) {
        parent.div('.dd-dive-run-input', col => {
            const title = filter.input_name.split(' ')[0].replaceAll('.', ' ') // we don't need the operator
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
            switch (filter.column_type) {
                case 'cents':
                    field.label().text('$')
                    this.inputFields.numberInput(field, filter.id)
                    break
                case 'number':
                    this.inputFields.numberInput(field, filter.id)
                    break
                default:
                    this.inputFields.textInput(field, filter.id)
            }
        })
    }

    renderDateRangeInput(parent: HtmlParentTag, filter: DateRangeFilter & FilterInput) {
        parent.div('.tt-compound-field', field => {
            this.inputFields.dateInput(field, `${filter.id}-min`)
            field.label().text('→')
            this.inputFields.dateInput(field, `${filter.id}-max`)
            field.a('.icon-only', {title: "Pick a common date range"}, a => {
                a.i('.glyp-pick_date')
            })
            .emitClick(this.pickDateKey, {id: filter.id})

        })
    }

    renderInclusionInput(parent: HtmlParentTag, filter: InclusionFilter & FilterInput) {
        parent.div('.inclusion-radios', container => {
            for (const possible of filter.possible_values || []) {
                container.label('.body-size', label => {
                    this.inputFields.checkbox(label, `${filter.id}-${possible}`)
                    label.span().text(inflection.titleize(possible))
                })
            }
        })
    }

}


////////////////////////////////////////////////////////////////////////////////
// Utilities
////////////////////////////////////////////////////////////////////////////////

/**
 * Generates a relative URL to download the output of the given run with an optional custom file name.
 * @param run
 * @param filename
 */
function outputUrl(run: DdDiveRun, filename?: string): string {
    if (!filename?.length) {
        const nameComps: string[] = []
        const dive = run.dd_dive
        if (dive) {
            nameComps.push(inflection.underscore(dive.name))
        }
        const d = dayjs(run.created_at)
        nameComps.push(d.format('YYYY-MM-DD_HHmmss'))
        filename = nameComps.join('_') + '.xlsx'
    }
    return `/data_dive/download_run/${run.id}/${filename}?t=${dayjs().format(Format.timestamp)}`
}

const DiveRuns = {
    outputUrl
}
export default DiveRuns

