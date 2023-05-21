import {SelectOptions} from "tuff-core/forms"
import {strings} from "tuff-core"

////////////////////////////////////////////////////////////////////////////////
// Options
////////////////////////////////////////////////////////////////////////////////

/**
 * Computes a `SelectOptions` array by titleizing the values in a plain string array.
 * @param opts
 */
function titleizeOptions(opts: string[], blank?: string): SelectOptions {
    const out = opts.map(c => {
        return {value: c, title: strings.titleize(c)}
    })
    if (blank != undefined) { // don't test length, allow it to be a blank string
        out.unshift({title: blank, value: ''})
    }
    return out
}


////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Forms = {
    titleizeOptions
}

export default Forms


