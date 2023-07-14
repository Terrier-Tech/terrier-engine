import {Field, FormFields, FormPartData, InputType, KeyOfType, SelectOptions} from "tuff-core/forms"
import {strings} from "tuff-core"
import {DbErrors} from "./db-client"
import {PartTag} from "tuff-core/parts"
import {InputTag, InputTagAttrs} from "tuff-core/html"
import TerrierPart from "./parts/terrier-part"

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
// Form Fields
////////////////////////////////////////////////////////////////////////////////

/**
 * Override regular `FormFields` methods to include validation errors.
 */
export class TerrierFormFields<T extends FormPartData> extends FormFields<T> {

    errors?: DbErrors<T>

    /**
     * You must pass a `TerrierPart` so that we can render the error bubble with it.
     * @param part
     * @param data
     * @param errors
     */
    constructor(part: TerrierPart<any>, data: T, errors?: DbErrors<T>) {
        super(part, data)
        this.errors = errors
    }

    protected input<Key extends KeyOfType<T, any> & string>(parent: PartTag, type: InputType, name: Key, serializerType: {
        new(name: string): Field<any, Element>
    }, attrs?: InputTagAttrs): InputTag {
        if (this.errors && this.errors[name]) {
            attrs ||= {}
            attrs.classes ||= []
            attrs.classes.push('error')
        }
        return super.input(parent, type, name, serializerType, attrs);
    }

    /**
     * Only renders the error bubble if the errors are set.
     * @param parent
     */
    renderErrorBubble(parent: PartTag) {
        if (this.errors) {
            (this.part as TerrierPart<any>).renderErrorBubble(parent, this.errors)
        }
    }
}



////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Forms = {
    titleizeOptions
}

export default Forms


