import { Logger } from "tuff-core/logging"
import { createElement } from "tuff-core/html"
import Theme, {ThemeType} from "./theme";

const log = new Logger('Toasts')

export type ToastOptions<TT extends ThemeType> = {
    color: TT['colors']
    icon?: TT['icons']
}

/**
 * Shows a toast message in a bubble in the upper right corner.
 * @param message the message text
 * @param options
 * @param theme the theme used to render the toast
 */
function show<TT extends ThemeType>(message: string, options: ToastOptions<TT>, theme: Theme<TT>) {
    log.info(`Show ${options.color  }: ${message}`)

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
        parent.class(options.color)
        if (options?.icon) {
            theme.renderIcon(parent, options.icon, 'white')
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