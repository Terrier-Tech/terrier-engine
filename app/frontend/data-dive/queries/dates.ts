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
 * NOTE: date ranges are always stored with the max being *exclusive*,
 * but should be displayed as *inclusive*.
 */
export type LiteralDateRange = {
    min: DateLiteral
    max: DateLiteral
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
        return `Between ${display(range.min)} and ${max}`
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
// Exports
////////////////////////////////////////////////////////////////////////////////

const Dates = {
    displayFormat,
    literalFormat,
    display,
    rangeDisplay,
    materializeVirtualRange
}

export default Dates