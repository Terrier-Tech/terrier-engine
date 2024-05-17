import {Logger} from "tuff-core/logging"
import {PartTag} from "tuff-core/parts"
import Messages from "tuff-core/messages"
import TerrierPart from "./parts/terrier-part"
import Arrays from "tuff-core/arrays"
import Tooltips from "./tooltips"

const log = new Logger("Emails")

////////////////////////////////////////////////////////////////////////////////
// Validation
////////////////////////////////////////////////////////////////////////////////

/**
 * Use this to split a string with multiple e-mails.
 */
const SplitRegex = /[\s,;]+/

/**
 * Splits a string containing multiple e-mail addresses.
 * @param emails
 */
function split(emails: string): string[] {
    return emails.split(SplitRegex)
}

/**
 * Basic e-mail validation regex.
 */
const ValidationRegex = /[^\s@]+@[^\s@]+\.[^\s;,@]+/

/**
 * Performs basic validation on an e-mail address.
 * @param email
 */
function validate(email: string): boolean {
    return ValidationRegex.test(email)
}


////////////////////////////////////////////////////////////////////////////////
// Form
////////////////////////////////////////////////////////////////////////////////

export type EmailListState = {
    emails: string[]
}

/**
 * An editor for an array of e-mail addresses.
 * Updates the emails state as they're changed, no need to serialize.
 * Listen for a `changedKey` message to know when they change.
 */
export class EmailListForm extends TerrierPart<EmailListState> {

    /**
     * A message with this key will get emitted any time the addresses change.
     */
    changedKey = Messages.typedKey<EmailListState>()

    private _changeKey = Messages.typedKey<{ index: number }>()

    /**
     * Gets temporarily set to to `true` when a change is made and it should grab the focus of the last field after rendering.
     * @private
     */
    private focusLastField = false

    async init() {
        this.onChange(this._changeKey, m => {
            const i = m.data.index
            const v = m.value
            let emails: Array<string|null> = this.state.emails
            log.info(`E-Mail address ${i} changed to ${v}`, m)
            if (i >= emails.length) {
                // it's a new value
                emails.push(v)
            }
            else {
                // it's an existing value
                emails[i] = v
            }
            this.state.emails = Arrays.compactStrings(emails)
            Tooltips.clear()
            this.focusLastField = true
            this.dirty()
            this.emitMessage(this.changedKey, this.state)
        })
    }

    get parentClasses(): Array<string> {
        return ['tt-flex', 'column', 'gap', 'email-list-form', 'tt-form']
    }

    render(parent: PartTag): any {
        const emails = this.state.emails.concat(['']) // always make sure there's one more field
        emails.forEach((email, index) => {
            const field = parent.input({type: 'email', value: email, placeholder: "bob@example.com"})
                .emitChange(this._changeKey, {index})
            if (email.length && !Emails.validate(email)) {
                field.class("error").data({tooltip: `'${email}' is not a valid e-mail address`})
            }
        })
    }


    update(elem: HTMLElement) {
        super.update(elem)

        if (this.focusLastField) {
            this.focusLastField = false
            const fields = elem.querySelectorAll("input[type=email]")
            if (fields.length) {
                (fields.item(fields.length - 1) as HTMLElement).focus()
            }
        }
    }
}


////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Emails = {
    split,
    validate
}
export default Emails