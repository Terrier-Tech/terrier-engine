import { Logger } from "tuff-core/logging"
import {Part, PartParent} from "tuff-core/parts"
import {TerrierPart} from "./parts"
import Tooltips from "./tooltips"
import Lightbox from "./lightbox"

// @ts-ignore
import logoUrl from './images/optimized/terrier-hub-logo-light.svg'
import Theme, {ThemeType} from "./theme"
import {ModalPart, ModalStackPart} from "./modals"
import {OverlayLayer, OverlayPart} from "./overlays"

const log = new Logger('App')
Logger.level = 'info'

/**
 * Main application part that renders the entire page.
 */
export abstract class TerrierApp<TT extends ThemeType> extends TerrierPart<{theme: Theme<TT>}, TT> {

    _theme!: Theme<TT>

    get theme(): Theme<TT> {
        return this._theme
    }

    overlayPart!: OverlayPart

    async init() {
        this._theme = this.state.theme
        this.overlayPart = this.makePart(OverlayPart, {})
        log.info("Initialized")
    }

    load() {
        // clear all overlays (i.e. dropdowns) whenever the page changes
        this.clearOverlays()
    }

    update(root: HTMLElement) {
        log.info(`Update`, root)
        Tooltips.init(root)
        Lightbox.init(root, this, 'body-content')
    }


    /// Overlays

    makeOverlay<OverlayType extends Part<StateType>, StateType>(
        constructor: { new(p: PartParent, id: string, state: StateType): OverlayType; },
        state: StateType,
        layer: OverlayLayer): OverlayType {
        return this.overlayPart.makeLayer(constructor, state, layer)
    }

    clearOverlay(layer: OverlayLayer) {
        this.overlayPart.clearLayer(layer)
        this.lastDropdownTarget = undefined
    }

    clearOverlays() {
        this.overlayPart.clearAll()
    }


    lastDropdownTarget?: HTMLElement


    /// Modals

    showModal<ModalType extends ModalPart<StateType, TT>, StateType>(constructor: { new(p: PartParent, id: string, state: StateType): ModalType; }, state: StateType): ModalType {
        const modalStack =
            (this.overlayPart.parts.modal as ModalStackPart<TT>)
                ?? this.makeOverlay(ModalStackPart, {}, 'modal')
        const modal = modalStack.pushModal(constructor, state)
        modalStack.dirty()
        return modal
    }


}
