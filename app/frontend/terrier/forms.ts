import {FieldConstructor, FormFields, FormPartData, InputType, KeyOfType, SelectOptions} from "tuff-core/forms"
import {DbErrors} from "./db-client"
import {PartTag} from "tuff-core/parts"
import {
    DefaultTagAttrs,
    DivTag,
    InputTag,
    InputTagAttrs,
    SelectTag,
    SelectTagAttrs,
    TextAreaTag,
    TextAreaTagAttrs
} from "tuff-core/html"
import TerrierPart from "./parts/terrier-part"
import GlypPicker from "./parts/glyp-picker"
import Glyps from "./glyps"
import Messages from "tuff-core/messages"
import {Logger} from "tuff-core/logging"
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

    protected addErrorClass(name: string, attrs: DefaultTagAttrs) {
        if (this.errors && this.errors[name]) {
            attrs ||= {}
            attrs.classes ||= []
            attrs.classes.push('error')
        }
    }

    input<Key extends KeyOfType<T,any> & string>(parent: PartTag, type: InputType, name: Key, serializerType: FieldConstructor<any, Element>, attrs: InputTagAttrs={}): InputTag {
        this.addErrorClass(name, attrs)
        return super.input(parent, type, name, serializerType, attrs);
    }

    select<Key extends keyof T & string, TSerializer extends FieldConstructor<T[Key], HTMLSelectElement>>(parent: PartTag, name: Key, options?: SelectOptions, attrs: SelectTagAttrs = {}, serializerType?: TSerializer): SelectTag {
        this.addErrorClass(name, attrs)
        return super.select(parent, name, options, attrs, serializerType);
    }

    textArea<Key extends keyof T & string, TSerializer extends FieldConstructor<T[Key], HTMLTextAreaElement>>(parent: PartTag, name: Key, attrs: TextAreaTagAttrs = {}, serializerType?: TSerializer): TextAreaTag {
        this.addErrorClass(name, attrs)
        return super.textArea(parent, name, attrs, serializerType);
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

    compoundField<Key extends keyof T & string>(parent: PartTag, key: Key, ...classes: string[]): CompoundFieldBuilder<T, Key> {
        return new CompoundFieldBuilder(this, parent, key, (this.part as TerrierPart<any>).theme, ...classes)
    }

    fileCompoundField<Key extends KeyOfType<T, File | FileList> & string>(parent: PartTag, key: Key, ...classes: string[]): FileCompoundFieldBuilder<T, Key> {
        return new FileCompoundFieldBuilder(this, parent, key, (this.part as TerrierPart<any>).theme, ...classes)
    }

    /**
     * Makes a label with a radio and title span inside of it.
     * @param parent
     * @param name
     * @param value
     * @param title the title to put in the label span
     * @param attrs attributes for the radio input
     */
    radioLabel<Key extends KeyOfType<T, string> & string>(parent: PartTag, name: Key, value: T[Key], title?: string, attrs: InputTagAttrs = {}) {
        return parent.label('.body-size', label => {
            this.radio(label, name, value, attrs)
            label.span().text(title || value)
        })
    }

}

class CompoundFieldBuilder<T extends Record<string, unknown>, K extends keyof T & string> {

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

    hiddenInput(attrs?: InputTagAttrs, serializerType?: FieldConstructor<T[K], HTMLInputElement>): this {
        this.formFields.hiddenInput(this.field, this.key, attrs ?? {}, serializerType)
        return this
    }
    textInput(attrs?: InputTagAttrs, serializerType?: FieldConstructor<T[K], HTMLInputElement>): this {
        this.formFields.textInput(this.field, this.key, attrs ?? {}, serializerType)
        return this
    }
    numberInput(attrs?: InputTagAttrs, serializerType?: FieldConstructor<T[K], HTMLInputElement>): this {
        this.formFields.numberInput(this.field, this.key, attrs ?? {}, serializerType)
        return this
    }
    emailInput(attrs?: InputTagAttrs, serializerType?: FieldConstructor<T[K], HTMLInputElement>): this {
        this.formFields.emailInput(this.field, this.key, attrs ?? {}, serializerType)
        return this
    }
    phoneInput(attrs?: InputTagAttrs, serializerType?: FieldConstructor<T[K], HTMLInputElement>): this {
        this.formFields.phoneInput(this.field, this.key, attrs ?? {}, serializerType)
        return this
    }
    passwordInput(attrs?: InputTagAttrs, serializerType?: FieldConstructor<T[K], HTMLInputElement>): this {
        this.formFields.passwordInput(this.field, this.key, attrs ?? {}, serializerType)
        return this
    }
    searchInput(attrs?: InputTagAttrs, serializerType?: FieldConstructor<T[K], HTMLInputElement>): this {
        this.formFields.searchInput(this.field, this.key, attrs ?? {}, serializerType)
        return this
    }
    urlInput(attrs?: InputTagAttrs, serializerType?: FieldConstructor<T[K], HTMLInputElement>): this {
        this.formFields.urlInput(this.field, this.key, attrs ?? {}, serializerType)
        return this
    }
    textArea(attrs?: TextAreaTagAttrs, serializerType?: FieldConstructor<T[K], HTMLTextAreaElement>): this {
        this.formFields.textArea(this.field, this.key, attrs ?? {}, serializerType)
        return this
    }
    dateInput(attrs?: InputTagAttrs, serializerType?: FieldConstructor<T[K], HTMLInputElement>): this {
        this.formFields.dateInput(this.field, this.key, attrs ?? {}, serializerType)
        return this
    }
    timeInput(attrs?: InputTagAttrs, serializerType?: FieldConstructor<T[K], HTMLInputElement>): this {
        this.formFields.timeInput(this.field, this.key, attrs ?? {}, serializerType)
        return this
    }
    dateTimeInput(attrs?: InputTagAttrs, serializerType?: FieldConstructor<T[K], HTMLInputElement>): this {
        this.formFields.dateTimeInput(this.field, this.key, attrs ?? {}, serializerType)
        return this
    }
    monthInput(attrs?: InputTagAttrs, serializerType?: FieldConstructor<T[K], HTMLInputElement>): this {
        this.formFields.monthInput(this.field, this.key, attrs ?? {}, serializerType)
        return this
    }
    weekInput(attrs?: InputTagAttrs, serializerType?: FieldConstructor<T[K], HTMLInputElement>): this {
        this.formFields.weekInput(this.field, this.key, attrs ?? {}, serializerType)
        return this
    }
    radio(value: T[K], attrs?: InputTagAttrs, serializerType?: FieldConstructor<T[K], HTMLInputElement>): this {
        this.formFields.radio(this.field, this.key, value, attrs ?? {}, serializerType)
        return this
    }
    checkbox(attrs?: InputTagAttrs, serializerType?: FieldConstructor<T[K], HTMLInputElement>): this {
        this.formFields.checkbox(this.field, this.key, attrs ?? {}, serializerType)
        return this
    }
    select(selectOptions?: SelectOptions, attrs?: InputTagAttrs, serializerType?: FieldConstructor<T[K], HTMLSelectElement>): this {
        this.formFields.select(this.field, this.key, selectOptions, attrs ?? {}, serializerType)
        return this
    }
    colorInput(attrs?: InputTagAttrs, serializerType?: FieldConstructor<T[K], HTMLInputElement>): this {
        this.formFields.colorInput(this.field, this.key, attrs ?? {}, serializerType)
        return this
    }

    readonly(text?: string): this {
        this.field.div('.readonly-field', {text: text ?? Objects.safeToString(this.formFields.data[this.key]) })
        return this
    }

    label(text: string, ...classes: string[]): this {
        this.formFields.labelFor(this.field, this.key, text, ...classes)
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

    icon(icon: IconName, color: ColorName | null = 'secondary'): this {
        this.field.label('.icon-only', label => {
            this.theme.renderIcon(label, icon, color)
        })
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

class FileCompoundFieldBuilder<T extends Record<string, unknown>, K extends KeyOfType<T, File | FileList> & string> extends CompoundFieldBuilder<T, K> {
    fileInput(attrs?: InputTagAttrs, serializerType?: FieldConstructor<T[K], HTMLInputElement>): this {
        this.formFields.fileInput(this.field, this.key, attrs ?? {}, serializerType)
        return this
    }
}




////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Forms = {
    getRadioValue
}

export default Forms


