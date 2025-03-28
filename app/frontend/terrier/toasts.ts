import {Logger} from "tuff-core/logging"
import Html from "tuff-core/html"
import Theme, {ColorName, IconName} from "./theme"

const log = new Logger('Toasts')

export type ToastOptions = {
    color: ColorName
    icon?: IconName
    duration?: 'long' | 'default' | number
}

/**
 * Shows a toast message in a bubble in the upper right corner.
 * @param message the message text
 * @param options
 * @param theme the theme used to render the toast
 */
function show(message: string, options: ToastOptions, theme: Theme) {
    log.info(`Show ${options.color  }: ${message}`)

    const duration =
        options.duration == 'long'
            ? 4000
            : typeof options.duration == 'number'
            ? options.duration
            : 2000

    // ensure the container exists
    let container = document.getElementById('tt-toasts')
    if (!container) {
        log.debug(`Creating toasts container`)
        container = Html.createElement('div', (div) => {
            div.sel('#tt-toasts.tt-flex.column.padded')
        })
        document.body.appendChild(container)
    }

    // create the toast element
    const toast = Html.createElement('div', (parent) => {
        parent.class('tt-toast')
        parent.class(options.color)
        if (options?.icon) {
            theme.renderIcon(parent, options.icon, null)
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
        duration
    )
}

const Toasts = {
    show
}

export default Toasts