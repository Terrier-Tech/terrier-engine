import { Logger } from "tuff-core/logging"
import Messages from "tuff-core/messages"
import { PartConstructor, PartTag } from "tuff-core/parts"
import ContentPart from "./parts/content-part"
import TerrierPart from "./parts/terrier-part"

const log = new Logger('Modals')


////////////////////////////////////////////////////////////////////////////////
// Base Part
////////////////////////////////////////////////////////////////////////////////

/**
 * Base class for all modals.
 * Since it extends ContentPart, all of the same title/action methods
 * available for pages can be used in modals as well.
 */
export abstract class ModalPart<TState> extends ContentPart<TState> {


    get parentClasses(): Array<string> {
        return ['modal-part', 'tt-typography']
    }

    protected pop() {
        this.emitMessage(modalPopKey, {}, { scope: 'bubble' })
    }

    render(parent: PartTag) {
        parent.div('.modal-header', header => {
            if (this._icon) {
                this.theme.renderIcon(header, this._icon, 'secondary')
            }
            header.h2({ text: this._title || 'Call setTitle()' })
            this.theme.renderActions(header, this.getActions('tertiary'), { defaultClass: 'secondary' })
            header.a('.close-modal', closeButton => {
                this.theme.renderCloseIcon(closeButton)
            }).emitClick(modalPopKey)
        })
        parent.div('.modal-content', content => {
            content.class(...this.contentClasses)
            this.renderContent(content)
        })
        const secondaryActions = this.getActions('secondary')
        const primaryActions = this.getActions('primary')
        if (secondaryActions.length || primaryActions.length) {
            const actionsClasses = ['modal-actions']
            if (this._actionLoading) {
                actionsClasses.push('loading')
            }
            parent.div(...actionsClasses, actions => {
                actions.div('.secondary-actions', container => {
                    this.theme.renderActions(container, secondaryActions, { defaultClass: 'secondary' })
                })
                actions.div('.primary-actions', container => {
                    this.theme.renderActions(container, primaryActions, { defaultClass: 'primary' })
                })
            })
        }
    }

    private _actionLoading = false

    /**
     * Blurs the actions to indicate that the modal is doing something.
     */
    startActionLoading() {
        const elem = this.element
        if (elem) {
            const actions = elem.querySelector('.modal-actions')
            if (actions) {
                this._actionLoading = true
                actions.classList.add('loading')
            }
        }
    }

    /**
     * Call after calling `startActionLoading()` to remove the loading effect.
     */
    stopActionLoading() {
        this._actionLoading = false
        const elem = this.element
        if (elem) {
            const actions = elem.querySelector('.modal-actions')
            if (actions) {
                actions.classList.remove('loading')
            }
        }
    }

}


////////////////////////////////////////////////////////////////////////////////
// Stack
////////////////////////////////////////////////////////////////////////////////

/**
 * Emit this key from anywhere inside a modal to pop it off the stack.
 */
export const modalPopKey = Messages.untypedKey()

export class ModalStackPart extends TerrierPart<{}> {

    displayClass: 'show' | 'hide' = 'show'

    async init() {
        this.onClick(modalPopKey, _ => this.pop())
        this.listenMessage(modalPopKey, _ => this.pop())
    }

    modals: ModalPart<any>[] = []

    /**
     * Pops the last modal off the stack and removes itself if it's empty.
     */
    pop() {
        log.info("Popping Modal")
        if (this.modals.length == 0) {
            this.close()
            return
        }
        const modal = this.modals.pop()
        if (modal) {
            // remove the modal element with
            modal.element?.remove()
            this.removeChild(modal)
        }
        if (this.modals.length == 0) {
            this.close()
        }
    }

    close() {
        const elem = this.element
        this.displayClass = 'hide'
        if (elem) {
            const stackElem = elem.querySelector('.tt-modal-stack')
            if (stackElem) {
                stackElem.classList.remove('show')
            }
        }

        this.dirty()
    }

    /**
     * Pushes a new modal to the stack
     * @param constructor the modal class
     * @param state the modal's state
     */
    pushModal<ModalType extends ModalPart<StateType>, StateType>(
        constructor: PartConstructor<ModalType, StateType>,
        state: NoInfer<StateType>
    ): ModalPart<StateType> {
        log.info(`Making modal`, constructor.name)
        const modal = this.makePart(constructor, state)
        this.modals.push(modal)

        const container = this.element?.querySelector<HTMLElement>('.modal-container')
        if (container) {
            // already rendered, append the modal to the stack without re-rendering the rest of the stack
            modal.appendIntoContainer(container).classList.add('hide')
            this.stale()
        } else {
            // haven't rendered yet, make sure the stack is shown, then render
            this.displayClass = 'show'
            this.dirty()
        }

        return modal
    }

    render(parent: PartTag) {
        const classes = [`stack-${this.modals.length}`]
        if (this.displayClass == 'show') {
            classes.push(this.displayClass)
        }
        parent.div('.tt-modal-stack', { classes }, stack => {
            stack.div('.modal-container', container => {
                this.eachChild(part => {
                    container.part(part)
                })
            })
        })
    }


    update(root: HTMLElement) {
        const stack = root.querySelector('.tt-modal-stack')
        if (stack && this.displayClass == 'show') {
            setTimeout(
                () => {
                    stack.classList.add('show')
                    stack.querySelectorAll('.modal-part').forEach(modal => {
                        modal.classList.add('show')
                    })
                }, 10
            )
        }
    }
}