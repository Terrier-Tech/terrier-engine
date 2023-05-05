import { createElement } from "tuff-core/html"
import Time from "tuff-core/time"
// @ts-ignore
import loaderUrl from '../../../../terrier-dot-tech/app/frontend/hub/images/optimized/terrier-hub-loader.svg'


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

function createOverlay(): HTMLDivElement {
    return createElement('div', div => {
        div.class(overlayClass)
        div.img({src: loaderUrl})
    })
}

/**
 * Creates and shows a loading overlay in the given container.
 * @param container
 */
function showOverlay(container: Element) {
    const existingOverlay = getOverlay(container)
    if (existingOverlay) {
        return
    }
    const overlay = createOverlay()
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
