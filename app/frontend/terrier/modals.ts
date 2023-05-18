import { Logger } from "tuff-core/logging"
import { untypedKey } from "tuff-core/messages"
import {ContentPart, TerrierPart} from "./parts"
import {PartParent, PartTag} from "tuff-core/parts"
import Theme, {ThemeType} from "./theme";
import {TerrierApp} from "./app";

const log = new Logger('Modals')


////////////////////////////////////////////////////////////////////////////////
// Base Part
////////////////////////////////////////////////////////////////////////////////

/**
 * Base class for all modals.
 * Since it extends ContentPart, all of the same title/action methods
 * available for pages can be used in modals as well.
 */
export abstract class ModalPart<T, TT extends ThemeType> extends ContentPart<T, TT> {


    get parentClasses(): Array<string> {
        return ['modal-part', 'tt-typography']
    }

    protected pop() {
        this.emitMessage(modalPopKey, {}, { scope: 'bubble' })
    }

    render(parent: PartTag)  {
        parent.div('.modal-header', header => {
            if (this._icon) {
                this.theme.renderIcon(header, this._icon, 'secondary')
            }
            header.h2({text: this._title || 'Call setTitle()'})
            this.theme.renderActions(header, this.getActions('tertiary'), {defaultClass: 'secondary'})
            header.a('.close-modal', closeButton => {
                this.theme.renderCloseIcon(closeButton)
            }).emitClick(modalPopKey)
        })
        parent.div('.modal-content', content => {
            this.renderContent(content)
        })
        const secondaryActions = this.getActions('secondary')
        const primaryActions = this.getActions('primary')
        if (secondaryActions.length || primaryActions.length) {
            parent.div('.modal-actions', actions => {
                actions.div('.secondary-actions', container => {
                    this.theme.renderActions(container, secondaryActions, {iconColor: 'white', defaultClass: 'secondary'})
                })
                actions.div('.primary-actions', container => {
                    this.theme.renderActions(container, primaryActions, {iconColor: 'white', defaultClass: 'primary'})
                })
            })
        }
    }

}


////////////////////////////////////////////////////////////////////////////////
// Stack
////////////////////////////////////////////////////////////////////////////////

/**
 * Emit this key from anywhere inside a modal to pop it off the stack.
 */
export const modalPopKey = untypedKey()

export class ModalStackPart<TT extends ThemeType> extends TerrierPart<{}, TT, TerrierApp<TT, Theme<TT>>, Theme<TT>> {

    displayClass: 'show' | 'hide' = 'show'

    async init() {
        this.onClick(modalPopKey, _ => this.pop())
        this.listenMessage(modalPopKey, _ => this.pop())
    }

    modals: ModalPart<unknown, TT>[] = []

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
            this.removeChild(modal)
        }
        if (this.modals.length == 0) {
            this.close()
        }
        this.dirty()
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
    }

    /**
     * Pushes a new modal to the stack
     * @param constructor the modal class
     * @param state the modal's state
     */
    pushModal<ModalType extends ModalPart<StateType, TT>, StateType>(constructor: { new(p: PartParent, id: string, state: StateType): ModalType; }, state: StateType): ModalType {
        log.info(`Making modal`, constructor.name)
        const modal = this.makePart(constructor, state)
        this.modals.push(modal)
        this.displayClass = 'show'
        this.dirty()
        return modal
    }


    render(parent: PartTag) {
        const classes = [`stack-${this.modals.length}`]
        if (this.displayClass == 'show') {
            classes.push(this.displayClass)
        }
        parent.div('.tt-modal-stack', {classes}, stack => {
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