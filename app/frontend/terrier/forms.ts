import {Field, FormFields, FormPartData, InputType, KeyOfType, SelectOptions} from "tuff-core/forms"
import {DbErrors} from "./db-client"
import {PartTag} from "tuff-core/parts"
import {DivTag, InputTag, InputTagAttrs, SelectTag, SelectTagAttrs, TextAreaTag, TextAreaTagAttrs} from "tuff-core/html"
import TerrierPart from "./parts/terrier-part"
import GlypPicker from "./parts/glyp-picker"
import Glyps from "./glyps"
import Messages from "tuff-core/messages"
import {Logger} from "tuff-core/logging"
import Strings from "tuff-core/strings"
import Theme, {Action, ColorName, IconName} from "./theme"
import Objects from "tuff-core/objects"
import {InlineStyle} from "tuff-core/tags"
import Hints, {Hint, HintRenderOptions} from "./hints"

const log = new Logger("TerrierForms")

////////////////////////////////////////////////////////////////////////////////
// Utilities
////////////////////////////////////////////////////////////////////////////////

/**
 * Get the value of the checked radio with the given selector.
 * @param container contains the radios
 * @param selector the CSS selector used to select the radios from the container
 */
function getRadioValue(container: HTMLElement, selector: string): string | undefined {
    let value: string | undefined = undefined
    container.querySelectorAll<HTMLInputElement>(selector).forEach(radio => {
        if (radio.checked) {
            value = radio.value
        }
    })
    return value
}


////////////////////////////////////////////////////////////////////////////////
// Options
////////////////////////////////////////////////////////////////////////////////

/**
 * Computes a `SelectOptions` array by titleizing the values in a plain string array.
 * @param opts
 */
function titleizeOptions(opts: readonly string[], blank?: string): SelectOptions {
    const out = opts.map(c => {
        return {value: c, title: Strings.titleize(c)}
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
 * Override regular `FormFields` methods to include validation errors and optional compound fields.
 */
export class TerrierFormFields<T extends FormPartData> extends FormFields<T> {

    errors?: DbErrors<T>

    pickGlypKey = Messages.typedKey<{ key: KeyOfType<T, string | undefined> & string }>()

    /**
     * You must pass a `TerrierPart` so that we can render the error bubble with it.
     * @param part
     * @param data
     * @param errors
     */
    constructor(part: TerrierPart<any>, data: T, errors?: DbErrors<T>) {
        super(part, data)
        this.errors = errors


        this.part.onClick(this.pickGlypKey, m => {
            log.info(`Pick glyp for ${m.data.key}`)
            const key = m.data.key as KeyOfType<T, string | undefined>
            const current = this.data[key]
            const onPicked = (icon?: string) => {
                this.data[key] = icon as any // TODO: figure out how to better make typescript happy
                this.part.dirty()
            }
            part.app.showModal(GlypPicker.Modal, {icon: current, onPicked})
        })
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

    select<Key extends KeyOfType<T, string> & string>(parent: PartTag, name: Key, options?: SelectOptions, attrs: SelectTagAttrs = {}): SelectTag {
        if (this.errors && this.errors[name]) {
            attrs ||= {}
            attrs.classes ||= []
            attrs.classes.push('error')
        }
        return super.select(parent, name, options, attrs);
    }

    textArea<Key extends KeyOfType<T, string> & string>(parent: PartTag, name: Key, attrs: TextAreaTagAttrs={}): TextAreaTag {
        if (this.errors && this.errors[name]) {
            attrs ||= {}
            attrs.classes ||= []
            attrs.classes.push('error')
        }
        return super.textArea(parent, name, attrs);
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

    /**
     * Render a readonly field for a glyp icon value that shows the glyp picker when clicked.
     * @param parent where to render the field
     * @param key the data key where the icon value is stored
     */
    renderGlypField<Key extends KeyOfType<T, string> & string>(parent: PartTag, key: Key) {
        const value = this.data[key]
        parent.a('.tt-readonly-field', field => {
            if (value?.length) {
                field.i(value)
                field.div().text(Glyps.displayName(value))
            } else {
                field.div().text("Pick Icon")
            }
        }).emitClick(this.pickGlypKey, {key})
    }

    compoundField<Key extends KeyOfType<T, string> & string>(parent: PartTag, key: Key, ...classes: string[]): StringCompoundFieldBuilder<T, Key> {
        return new StringCompoundFieldBuilder(this, parent, key, (this.part as TerrierPart<any>).theme, ...classes)
    }

    numericCompoundField<Key extends KeyOfType<T, number> & string>(parent: PartTag, key: Key, ...classes: string[]): NumericCompoundFieldBuilder<T, Key> {
        return new NumericCompoundFieldBuilder(this, parent, key, (this.part as TerrierPart<any>).theme, ...classes)
    }

    fileCompoundField<Key extends KeyOfType<T, File> & string>(parent: PartTag, key: Key, ...classes: string[]): FileCompoundFieldBuilder<T, Key> {
        return new FileCompoundFieldBuilder(this, parent, key, (this.part as TerrierPart<any>).theme, ...classes)
    }

    booleanCompoundField<Key extends KeyOfType<T, boolean> & string>(parent: PartTag, key: Key, ...classes: string[]): BooleanCompoundFieldBuilder<T, Key> {
        return new BooleanCompoundFieldBuilder(this, parent, key, (this.part as TerrierPart<any>).theme, ...classes)
    }

    /**
     * Makes a label with a radio and title span inside of it.
     * @param parent
     * @param name
     * @param value
     * @param title the title to put in the label span
     * @param attrs attributes for the radio input
     */
    radioLabel<Key extends KeyOfType<T, string> & string>(parent: PartTag, name: Key, value: string, title?: string, attrs: InputTagAttrs = {}) {
        return parent.label('.body-size', label => {
            this.radio(label, name, value, attrs)
            label.span().text(title || value)
        })
    }

}

abstract class CompoundFieldBuilder<T extends Record<string, unknown>, K extends KeyOfType<T, unknown> & string> {

    field!: DivTag

    constructor(readonly formFields: TerrierFormFields<T>, readonly parent: PartTag, readonly key: K, readonly theme: Theme, ...classes: string[]) {
        this.field = parent.div('.tt-compound-field')
        // add the error class if this key (or key_id) is in the errors object
        if (formFields.errors && (formFields.errors[key] || formFields.errors[`${key}_id`] || formFields.errors[key.replace(/_id$/,'')])) {
            this.field.class('error')
        }
        if (classes.length) {
            this.field.class(...classes)
        }
    }

    readonly(text?: string): this {
        this.field.div('.readonly', {text: text ?? Objects.safeToString(this.formFields.data[this.key]) })
        return this
    }

    label(text: string, ...classes: string[]): this {
        this.field.label({ text, htmlFor: `${this.formFields.part.id}-${this.key}`, classes })
        return this
    }

    tooltip(text: string): this {
        this.field.dataAttr('tooltip', text)
        return this
    }

    hint(hint: Hint, options?: HintRenderOptions): this {
        Hints.renderHint(this.theme, this.field, hint, options)
        return this
    }

    icon(icon: IconName, color: ColorName = 'secondary'): this {
        this.theme.renderIcon(this.field, icon, color)
        return this
    }

    css(styles: InlineStyle): this {
        this.field.css(styles)
        return this
    }

    action(action: Action, color: ColorName = 'link'): this {
        action.classes ||= []
        action.classes.push(color)
        this.theme.renderActions(this.field, action, {iconColor: color})
        return this
    }

    class(...s: string[]): this {
        this.field.class(...s)
        return this
    }
}

class StringCompoundFieldBuilder<T extends Record<string, unknown>, K extends KeyOfType<T, string> & string> extends CompoundFieldBuilder<T, K> {
    hiddenInput(attrs?: InputTagAttrs): this {
        this.formFields.hiddenInput(this.field, this.key, attrs ?? {})
        return this
    }
    textInput(attrs?: InputTagAttrs): this {
        this.formFields.textInput(this.field, this.key, attrs ?? {})
        return this
    }
    emailInput(attrs?: InputTagAttrs): this {
        this.formFields.emailInput(this.field, this.key, attrs ?? {})
        return this
    }
    phoneInput(attrs?: InputTagAttrs): this {
        this.formFields.phoneInput(this.field, this.key, attrs ?? {})
        return this
    }
    passwordInput(attrs?: InputTagAttrs): this {
        this.formFields.passwordInput(this.field, this.key, attrs ?? {})
        return this
    }
    searchInput(attrs?: InputTagAttrs): this {
        this.formFields.searchInput(this.field, this.key, attrs ?? {})
        return this
    }
    urlInput(attrs?: InputTagAttrs): this {
        this.formFields.urlInput(this.field, this.key, attrs ?? {})
        return this
    }
    textArea(attrs?: TextAreaTagAttrs): this {
        this.formFields.textArea(this.field, this.key, attrs ?? {})
        return this
    }
    dateInput(attrs?: InputTagAttrs): this {
        this.formFields.dateInput(this.field, this.key, attrs ?? {})
        return this
    }
    timeInput(attrs?: InputTagAttrs): this {
        this.formFields.timeInput(this.field, this.key, attrs ?? {})
        return this
    }
    dateTimeInput(attrs?: InputTagAttrs): this {
        this.formFields.dateTimeInput(this.field, this.key, attrs ?? {})
        return this
    }
    monthInput(attrs?: InputTagAttrs): this {
        this.formFields.monthInput(this.field, this.key, attrs ?? {})
        return this
    }
    weekInput(attrs?: InputTagAttrs): this {
        this.formFields.weekInput(this.field, this.key, attrs ?? {})
        return this
    }
    radio(value: string, attrs?: InputTagAttrs): this {
        this.formFields.radio(this.field, this.key, value, attrs ?? {})
        return this
    }
    select(selectOptions?: SelectOptions, attrs?: InputTagAttrs): this {
        this.formFields.select(this.field, this.key, selectOptions, attrs ?? {})
        return this
    }
    colorInput(attrs?: InputTagAttrs): this {
        this.formFields.colorInput(this.field, this.key, attrs ?? {})
        return this
    }
}

class NumericCompoundFieldBuilder<T extends Record<string, unknown>, K extends KeyOfType<T, number> & string> extends CompoundFieldBuilder<T, K> {
    numberInput(attrs?: InputTagAttrs): this {
        this.formFields.numberInput(this.field, this.key, attrs ?? {})
        return this
    }
}

class FileCompoundFieldBuilder<T extends Record<string, unknown>, K extends KeyOfType<T, File> & string> extends CompoundFieldBuilder<T, K> {
    fileInput(attrs?: InputTagAttrs): this {
        this.formFields.fileInput(this.field, this.key, attrs ?? {})
        return this
    }
}

class BooleanCompoundFieldBuilder<T extends Record<string, unknown>, K extends KeyOfType<T, boolean> & string> extends CompoundFieldBuilder<T, K> {

    checkbox(attrs?: InputTagAttrs): this {
        this.formFields.checkbox(this.field, this.key, attrs ?? {})
        return this
    }
}



////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Forms = {
    titleizeOptions,
    getRadioValue
}

export default Forms


