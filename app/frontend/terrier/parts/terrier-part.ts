import {Part, PartTag} from "tuff-core/parts"
import {TerrierApp} from "../app"
import Loading from "../loading"
import Theme, {IconName} from "../theme"
import Toasts, {ToastOptions} from "../toasts"
import {DbErrors} from "../db-client"
import * as inflection from "inflection"

/**
 * Base class for ALL parts in a Terrier application.
 */
export default abstract class TerrierPart<TState> extends Part<TState> {

    get app(): TerrierApp<any> {
        return this.root as TerrierApp<any>
    }

    get theme(): Theme {
        return this.app.theme
    }

    /// Loading

    /**
     * This can be overloaded if the loading overlay should go
     * somewhere other than the part's root element.
     */
    getLoadingContainer(): Element | null | undefined {
        return this.element
    }

    protected _isLoading = false


    /**
     * Shows the loading animation on top of the part.
     */
    startLoading() {
        this._isLoading = true
        const elem = this.getLoadingContainer()
        if (!elem) {
            return
        }
        Loading.showOverlay(elem, this.theme)
    }

    /**
     * Removes the loading animation from the part.
     */
    stopLoading() {
        this._isLoading = false
        const elem = this.getLoadingContainer()
        if (!elem) {
            return
        }
        Loading.removeOverlay(elem)
    }

    /**
     * Shows the loading overlay until the given function completes (either returns successfully or throws an exception)
     * @param func
     */
    showLoading(func: () => void): void
    showLoading(func: () => Promise<void>): Promise<void>
    showLoading(func: () => void | Promise<void>): void | Promise<void>  {
        this.startLoading()
        let stopImmediately = true
        try {
            const res = func()
            if (res) {
                stopImmediately = false
                return res.finally(() => {
                    this.stopLoading()
                })
            }
        } finally {
            if (stopImmediately) {
                this.stopLoading()
            }
        }
    }

    update(elem: HTMLElement) {
        super.update(elem);
        if (!this._isLoading) return

        const loadingContainer = this.getLoadingContainer()
        if (!loadingContainer) return

        const existingOverlay = Loading.getOverlay(elem)
        const existingLoadingContainer = existingOverlay?.parentElement

        if (
            existingLoadingContainer &&
            existingLoadingContainer != loadingContainer &&
            existingLoadingContainer.contains(loadingContainer)
        ) {
            // If there's an existing overlay on this part, but on an ancestor of our loading container,
            // remove the existing overlay so our loading container gets the overlay.
            // This case happens most frequently when the loading container doesn't yet exist on first render, but
            // does exist on subsequent renders. In that case, we prefer the more specific loading container.
            Loading.removeOverlay(elem)
        }

        Loading.showOverlay(loadingContainer, this.theme)
    }


    /// Errors

    renderErrorBubble(parent: PartTag, errors: DbErrors<any>) {
        parent.div('.tt-bubble.alert', bubble => {
            bubble.ul(ul => {
                for (const kv of Object.entries(errors)) {
                    const name = inflection.titleize(kv[0])
                    ul.li().text(`${name} ${kv[1]}`)
                }
            })
        })
    }


    /// Toasts

    /**
     * Shows a toast message in a bubble in the upper right corner.
     * @param message the message text
     * @param options
     */
    showToast(message: string, options: ToastOptions) {
        Toasts.show(message, options, this.theme)
    }

    /**
     * Show an alert toast with the given message.
     * @param message
     * @param icon
     */
    alertToast(message: string, icon?: IconName) {
        this.showToast(message, {icon, color: 'alert'})
    }

    /**
     * Show an info toast with the given message.
     * @param message
     * @param icon
     */
    infoToast(message: string, icon?: IconName) {
        this.showToast(message, {icon, color: 'primary'})
    }

    /**
     * Show a success toast with the given message.
     * @param message
     * @param icon
     */
    successToast(message: string, icon?: IconName) {
        this.showToast(message, {icon, color: 'success'})
    }

}