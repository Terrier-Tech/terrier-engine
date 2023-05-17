import inflection from "inflection"
import dayjs from "dayjs"


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
 */
export type LiteralDateRange = {
    min?: DateLiteral
    max?: DateLiteral
}

/**
 * A date range that's relative to the current date.
 */
export type VirtualDateRange = {
    period: 'day' | 'week' | 'month' | 'year'
    relative: number
}

export type DateRange = LiteralDateRange | VirtualDateRange


////////////////////////////////////////////////////////////////////////////////
// Display
////////////////////////////////////////////////////////////////////////////////

const format = 'MM/DD/YY'

/**
 * Formats the date literal into a human-friendly string.
 * @param date
 */
function display(date: DateLiteral): string {
    return dayjs(date).format(format)
}

/**
 * Computes a string that describes the given date range in human terms.
 * @param range
 */
function rangeDisplay(range: DateRange): string {
    if ('min' in range) { // literal range
        if (range.min && range.max) {
            return `Between ${display(range.min)} and ${display(range.max)}`
        }
        if (range.min) {
            return `On or after ${display(range.min)}`
        }
        if (range.max) {
            return `On or before ${display(range.max)}`
        }
        return "All Dates"
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
// Exports
////////////////////////////////////////////////////////////////////////////////

const Dates = {
    format,
    display,
    rangeDisplay
}

export default Dates