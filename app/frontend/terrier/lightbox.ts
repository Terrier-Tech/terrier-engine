import { Logger } from "tuff-core/logging"
import { untypedKey } from "tuff-core/messages"
import {Part, PartTag} from "tuff-core/parts"
import {TerrierApp} from "./app"
import Theme, {ThemeType} from "./theme"

const log = new Logger('Lightbox')

////////////////////////////////////////////////////////////////////////////////
// Global Event Listener
////////////////////////////////////////////////////////////////////////////////

/**
 * Initializes a global event listener for image elements contained in the `containerClass`
 * @param root
 * @param app
 * @param containerClass
 */
function init<
    TT extends ThemeType,
    TApp extends TerrierApp<TT, TApp, TTheme>,
    TTheme extends Theme<TT>
>(root: HTMLElement, app: TApp, containerClass: string) {
    log.info("Init", root)
    root.addEventListener("click", evt => {
        if (!(evt.target instanceof HTMLElement) || evt.target.tagName != 'IMG') {
            return
        }
        const elem = evt.target as HTMLImageElement

        // filter the target by the container class
        let show = false
        for (const ancestor of evt.composedPath()) {
            if (ancestor instanceof HTMLElement && ancestor.classList.contains(containerClass)) {
                show = true
            }
        }
        if (!show) {
            return
        }

        const src = elem.src
        log.info(`Clicked on lightbox image ${src}`, evt, elem)
        showPart(app, {src})

    }, {capture: true})
}


////////////////////////////////////////////////////////////////////////////////
// Part
////////////////////////////////////////////////////////////////////////////////

type LightboxState = { src: string }

function showPart<
    TT extends ThemeType,
    TApp extends TerrierApp<TT,TApp, TTheme>,
    TTheme extends Theme<TT>
>(app: TApp, state: LightboxState) {
    app.addOverlay(LightboxPart, {app,...state}, 'lightbox')
}

const closeKey = untypedKey()

class LightboxPart<
    TT extends ThemeType,
    TApp extends TerrierApp<TT, TApp, TTheme>,
    TTheme extends Theme<TT>
> extends Part<LightboxState & {app: TApp}> {

    async init() {
        this.onClick(closeKey, _ => {
            this.close()
        })
    }

    render(parent: PartTag) {
        parent.div('.scroller', scroller => {
            scroller.img({src: this.state.src})
        })
        .emitClick(closeKey)
    }

    update(_elem: HTMLElement) {
        setTimeout(_ => {
            _elem.classList.add('active') // start css fade in
        }, 10)
    }

    close() {
        this.element?.classList.remove('active')
        setTimeout(_ => {
            this.state.app.removeOverlay(this.state)
        }, 500)
    }
}



////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Lightbox = {
    init
}

export default Lightbox