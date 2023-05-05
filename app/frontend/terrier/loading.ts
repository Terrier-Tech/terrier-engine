import { createElement } from "tuff-core/html"
import Time from "tuff-core/time"
import Theme, {ThemeType} from "./theme";



const overlayClass = 'loading-overlay'

////////////////////////////////////////////////////////////////////////////////
// Overlay
////////////////////////////////////////////////////////////////////////////////

function getOverlay(container: Element): HTMLDivElement | null {
    const elems = container.getElementsByClassName(overlayClass)
    if (elems.length) {
        return elems[0] as HTMLDivElement
    }
    return null
}

function createOverlay<TT extends ThemeType>(theme: Theme<TT>): HTMLDivElement {
    return createElement('div', div => {
        div.class(overlayClass)
        const loaderSrc = theme.getLoaderSrc()
        if (loaderSrc?.length) {
            div.img({src: loaderSrc})
        }
    })
}

/**
 * Creates and shows a loading overlay in the given container.
 * @param container
 */
function showOverlay<TT extends ThemeType>(container: Element, theme: Theme<TT>) {
    const existingOverlay = getOverlay(container)
    if (existingOverlay) {
        return
    }
    const overlay = createOverlay(theme)
    container.append(overlay)
    Time.wait(0).then(() => overlay.classList.add("active")) // start css fade in
}

/**
 * Removes the loading overlay (if present) from the given container.
 * @param container
 */
function removeOverlay(container: Element) {
    const overlay = getOverlay(container)
    if (overlay) {
        overlay.classList.remove('active')
        Time.wait(500).then(() => {
            overlay.remove()
        })
    }
}


////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Loading = {
    getOverlay,
    showOverlay,
    removeOverlay
}

export default Loading
