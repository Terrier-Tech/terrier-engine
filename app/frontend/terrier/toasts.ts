import { Logger } from "tuff-core/logging"
import { createElement } from "tuff-core/html"
import {ColorName} from "../../../../terrier-dot-tech/app/frontend/hub/gen/theme"
import Icons, {IconName} from "../../../../terrier-dot-tech/app/frontend/hub/gen/icons"

const log = new Logger('Toasts')

export type ToastType = ColorName

export type ToastOptions = {
    icon?: IconName
}

/**
 * Shows a toast message in a bubble in the upper right corner.
 * @param type the color of the bubble
 * @param message the message text
 */
function show(type: ToastType, message: string, options?: ToastOptions) {
    log.info(`Show ${type}: ${message}`)

    // ensure the container exists
    let container = document.getElementById('toasts')
    if (!container) {
        container = createElement('div', (div) => {
            div.sel('#toasts.flex.column.padded')
        })
        document.body.appendChild(container)
    }

    // create the toast element
    const toast = createElement('div', (parent) => {
        parent.class(type)
        if (options?.icon) {
            Icons.renderIcon(parent, options.icon, 'white')
        }
        parent.span('.text', {text: message})
    })
    container.appendChild(toast)

    // show the element after a short delay
    setTimeout(
        () => {
            if (toast.isConnected) {
                toast.classList.add('show')
            }
        },
        100
    )

    // function to remove the toast if it's clicked or after a timeout
    const remove = () => {
        if (toast.isConnected) {
            toast.classList.remove('show')
            setTimeout(
                () => {toast.remove()},
                500
            )
        }
    }

    // remove the toast if it's clicked
    toast.addEventListener('click', _ => {
        remove()
    })

    // remove the toast after a couple seconds
    setTimeout(
        () => remove(),
        2000
    )
}

const Toasts = {
    show
}

export default Toasts