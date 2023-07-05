
////////////////////////////////////////////////////////////////////////////////
// Currency
////////////////////////////////////////////////////////////////////////////////

/**
 * Formats a cents value as a dollars string.
 * @param c an integer number of cents
 */
function cents(c: number | string): string {
    const num = typeof c == 'number' ? c : parseInt(c)
    return '$' + (num/100).toFixed(2)
}


////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Format = {
    cents
}

export default Format