import { Logger } from "tuff-core/logging"
import {Part, PartConstructor, PartParent} from "tuff-core/parts"
import TerrierPart from "./parts/terrier-part"
import Tooltips from "./tooltips"
import Lightbox from "./lightbox"
import Theme from "./theme"
import {ModalPart, ModalStackPart} from "./modals"
import {OverlayLayerType, OverlayPart} from "./overlays"

// @ts-ignore
import logoUrl from './images/optimized/terrier-hub-logo-light.svg'

const log = new Logger('App')
Logger.level = 'info'

/**
 * Main application part that renders the entire page.
 */
export abstract class TerrierApp<TState> extends TerrierPart<TState> {

    _theme!: Theme
    
    get theme(): Theme {
        return this._theme
    }

    overlayPart!: OverlayPart

    async init() {
        this._theme = new Theme()
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

    addOverlay<OverlayType extends Part<StateType>, StateType extends {}>(
        constructor: { new(p: PartParent, id: string, state: StateType): OverlayType; },
        state: StateType,
        type: OverlayLayerType
    ) {
        return this.overlayPart.pushLayer(constructor, state, type)
    }

    removeOverlay<StateType extends {}>(state: StateType): boolean {
        return this.overlayPart.removeLayer(state)
    }

    popOverlay(type?: OverlayLayerType) {
        this.overlayPart.popLayer(type)
    }

    clearOverlays() {
        this.overlayPart.clearAll()
    }

    removeDropdown<StateType>(state: StateType): boolean {
        this.lastDropdownTarget = undefined
        return this.overlayPart.removeLayer(state)
    }

    clearDropdowns() {
        this.lastDropdownTarget = undefined
        this.popOverlay('dropdown')
    }


    lastDropdownTarget?: HTMLElement


    /// Modals

    showModal<ModalType extends ModalPart<StateType>, StateType>(
        constructor: PartConstructor<ModalType, StateType>,
        state: StateType
    ): ModalType {
        const modalStack = this.overlayPart.getOrCreateLayer(ModalStackPart, {}, 'modal')
        const modal = modalStack.pushModal(constructor, state)
        modalStack.dirty()
        return modal as ModalType
    }


}
