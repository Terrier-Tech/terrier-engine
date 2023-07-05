import inflection from "inflection"
import dayjs from "dayjs"
import {Dropdown} from "../../terrier/dropdowns"
import {PartTag} from "tuff-core/parts"
import {messages} from "tuff-core"
import {Logger} from "tuff-core/logging"

const log = new Logger("Dates")


////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

type d = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 0
type YYYY = `19${d}${d}` | `20${d}${d}`
type oneToNine = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
type MM = `0${oneToNine}` | `1${0 | 1 | 2}`
type DD = `${0}${oneToNine}` | `${1 | 2}${d}` | `3${0 | 1}`

/**
 * YYYY-MM month literal.
 */
export type MonthLiteral = `${YYYY}-${MM}`

/**
 * YYYY-MM-DD date literal.
 */
export type DateLiteral = `${MonthLiteral}-${DD}`


/**
 * A date range described by literal start and end dates.
 * NOTE: date ranges are always stored with the max being *exclusive*,
 * but should be displayed as *inclusive*.
 */
export type LiteralDateRange = {
    min: DateLiteral
    max: DateLiteral
}


const virtualPeriods = ['day', 'week', 'month', 'year'] as const

export type VirtualDatePeriod = typeof virtualPeriods[number]

/**
 * A date range that's relative to the current date.
 */
export type VirtualDateRange = {
    period: VirtualDatePeriod
    relative: number
}

export type DateRange = LiteralDateRange | VirtualDateRange


////////////////////////////////////////////////////////////////////////////////
// Display
////////////////////////////////////////////////////////////////////////////////

/**
 * Format used for displaying dates to the user.
 */
const displayFormat = 'MM/DD/YY'

/**
 * Format used for storing dates.
 */
const literalFormat = 'YYYY-MM-DD'

/**
 * Formats the date literal into a human-friendly string.
 * @param date
 */
function display(date: DateLiteral): string {
    return dayjs(date).format(displayFormat)
}

/**
 * Computes a string that describes the given date range in human terms.
 * @param range
 */
function rangeDisplay(range: DateRange): string {
    if ('min' in range) { // literal range
        // special case for a single day
        const dMin = dayjs(range.min)
        if (range.max == dMin.add(1, 'day').format(literalFormat)) {
            return dMin.format(displayFormat)
        }
        const max = dayjs(range.max).subtract(1, 'day').format(displayFormat)
        return `${display(range.min)} - ${max}`
    } else if ('period' in range) { // virtual range
        // special day names
        if (range.period == 'day') {
            switch (range.relative) {
                case 0:
                    return 'Today'
                case -1:
                    return 'Yesterday'
                case 1:
                    return 'Tomorrow'
            }
        }
        if (range.relative == 0) {
            return `This ${range.period}`
        }
        if (range.relative == -1) {
            return `Last ${range.period}`
        }
        if (range.relative == 1) {
            return `Next ${range.period}`
        }
        const plural = inflection.pluralize(range.period)
        if (range.relative < 0) {
            return `${range.relative*-1} ${plural} ago`
        } else {
            return `${range.relative} ${plural} from now`
        }
    } else {
        return "Unknown Date Range"
    }
}


////////////////////////////////////////////////////////////////////////////////
// Calculation
////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a literal date range based on a virtual one, relative to `today`
 * @param range a virtual date range to materialize
 * @param today the anchor for the relative range
 */
function materializeVirtualRange(range: VirtualDateRange, today?: DateLiteral): LiteralDateRange {
    const d = dayjs(today)
    const min = d.add(range.relative, range.period).startOf(range.period)
    const max = min.add(1, range.period)
    return {
        min: min.format(literalFormat) as DateLiteral,
        max: max.format(literalFormat) as DateLiteral
    }
}


////////////////////////////////////////////////////////////////////////////////
// Periods
////////////////////////////////////////////////////////////////////////////////

/**
 * Parse a period string into a literal date range.
 * @param period
 */
function parsePeriod(period: string): LiteralDateRange {
    const comps = period.split(':')
    if (comps.length == 1) {
        if (period.match(/^\d{4}$/)) {
            // year
            const y = parseInt(period)
            return {
                min: `${y}-01-01` as DateLiteral,
                max: `${y+1}-01-01` as DateLiteral
            }
        }
        if (period.match(/^\d{4}-\d{2}$/)) {
            // month
            const d = dayjs(`${period}-01`)
            return {
                min: d.format(literalFormat) as DateLiteral,
                max: d.add(1, 'month').format(literalFormat) as DateLiteral
            }
        }
        if (period.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // day
            const d = dayjs(period)
            return {
                min: d.format(literalFormat) as DateLiteral,
                max: d.add(1, 'day').format(literalFormat) as DateLiteral
            }
        }
    }
    else if (comps.length == 2) {
        return {
            min: comps[0] as DateLiteral,
            max: comps[1] as DateLiteral
        }
    }
    throw `Invalid period format ${period}`
}

/**
 * Serializes a literal date range into a period string.
 * @param range
 */
function serializePeriod(range: LiteralDateRange): string {
    return `${range.min}:${range.max}`
}


////////////////////////////////////////////////////////////////////////////////
// Period Picker
////////////////////////////////////////////////////////////////////////////////

export type DatePeriodPickerState = {
    initial?: LiteralDateRange
    callback: (period: LiteralDateRange) => any
}

/**
 * Allows the user to pick a data period from a set of common ones.
 */
export class DatePeriodPickerPart extends Dropdown<DatePeriodPickerState> {

    periodKey = messages.typedKey<{period: string}>()

    async init() {
        await super.init()
        this.onClick(this.periodKey, m => {
            const range = parsePeriod(m.data.period)
            log.info(`Picked period ${m.data.period}`, range)
            this.state.callback(range)
            this.clear()
        })
    }

    get parentClasses(): Array<string> {
        return ['tt-date-period-picker']
    }

    get autoClose(): boolean {
        return true
    }

    renderContent(parent: PartTag): void {
        const today = dayjs()
        const pInitial = this.state.initial ? serializePeriod(this.state.initial) : ''
        log.info(`Initial period is ${pInitial}`)
        parent.div('.year-grid', grid => {
            for (let year = today.year()-2; year < today.year()+1; year++) {
                grid.div('.year-column', col => {
                    // year button
                    const pYear = serializePeriod(parsePeriod(year.toString()))
                    const yearClasses = ['year']
                    if (pYear == pInitial) {
                        yearClasses.push('current')
                    }
                    col.a({text: year.toString()})
                        .class(...yearClasses)
                        .emitClick(this.periodKey, {period: pYear})

                    // month buttons
                    for (let m = 0; m < 12; m++) {
                        const d = today.set('month', m)
                        const pMonth = serializePeriod(parsePeriod(`${year}-${d.format('MM')}`))
                        const monthClasses = ['month']
                        if (pMonth == pInitial) {
                            monthClasses.push('current')
                        }
                        col.a({text: d.format('MMMM')})
                            .class(...monthClasses)
                            .emitClick(this.periodKey, {period: pMonth})
                    }
                })
            }
        })
    }

}


////////////////////////////////////////////////////////////////////////////////
// Exports
////////////////////////////////////////////////////////////////////////////////

const Dates = {
    displayFormat,
    literalFormat,
    display,
    rangeDisplay,
    materializeVirtualRange,
    virtualPeriods,
    parsePeriod,
    serializePeriod
}

export default Dates