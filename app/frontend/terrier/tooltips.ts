import { Logger } from "tuff-core/logging"
import Html from "tuff-core/html"
import Overlays from "./overlays"

const log = new Logger('Tooltips')

let container: HTMLElement | null = null

function ensureContainer(): HTMLElement {
    if (container) {
        return container
    }
    container = Html.createElement('div', div => {
        div.sel('#tooltip')
    })
    document.body.appendChild(container)
    return container
}

function onEnter(target: HTMLElement) {
    log.debug("Mouse enter", target)
    const container = ensureContainer()
    container.classList.add('show')
    container.innerHTML = target.dataset.tooltip ?? ''
    Overlays.anchorElement(container, target)
}

function onLeave(target: HTMLElement) {
    log.debug("Mouse leave", target)
    if (container) {
        container.classList.remove('show')
    }
}

/**
 * Initializes the mouse enter/leave event handlers on the given root element.
 * This should be called during the root element's `update()` method.
 * @param root the root of the DOM over which tooltips listeners should be handled
 */
function init(root: HTMLElement) {
    log.debug("Init", root)
    root.addEventListener("click", evt => {
        if (container && container.classList.contains('show')) {
            log.debug("Hiding tooltip", evt)
            container.classList.remove('show')
        }
    }, {capture: true})
    root.addEventListener("mouseenter", evt => {
        if ((evt.target as HTMLElement).dataset?.tooltip?.length) {
            onEnter(evt.target as HTMLElement)
        }
    }, {capture: true})
    root.addEventListener("mouseleave", evt => {
        if ((evt.target as HTMLElement).dataset?.tooltip?.length) {
            onLeave(evt.target as HTMLElement)
        }
    }, {capture: true})
}

const Tooltips = {
    init
}

export default Tooltips