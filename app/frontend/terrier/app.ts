import { Logger } from "tuff-core/logging"
import {Part, PartConstructor, PartParent} from "tuff-core/parts"
import {TerrierPart} from "./parts"
import Tooltips from "./tooltips"
import Lightbox from "./lightbox"
import Theme, {ThemeType} from "./theme"
import {ModalPart, ModalStackPart} from "./modals"
import {OverlayLayerType, OverlayPart} from "./overlays"

// @ts-ignore
import logoUrl from './images/optimized/terrier-hub-logo-light.svg'

const log = new Logger('App')
Logger.level = 'info'

/**
 * Main application part that renders the entire page.
 */
export abstract class TerrierApp<
    TThemeType extends ThemeType,
    TSelf extends TerrierApp<TThemeType, TSelf, TTheme>,
    TTheme extends Theme<TThemeType>
> extends TerrierPart<{theme: TTheme}, TThemeType, TSelf, TTheme> {

    _theme!: TTheme

    get theme(): TTheme {
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
        Lightbox.init<TThemeType, TSelf, TTheme>(root, this as unknown as TSelf, 'body-content')
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

    removeDropdown<StateType extends {}>(state: StateType): boolean {
        this.lastDropdownTarget = undefined
        return this.overlayPart.removeLayer(state)
    }

    clearDropdowns() {
        this.lastDropdownTarget = undefined
        this.popOverlay('dropdown')
    }


    lastDropdownTarget?: HTMLElement


    /// Modals

    showModal<ModalType extends ModalPart<StateType, TThemeType, TSelf, TTheme>, StateType>(
        constructor: PartConstructor<ModalType, StateType>,
        state: StateType
    ): ModalType {
        const modalStack = this.overlayPart.getOrCreateLayer(ModalStackPart, {}, 'modal')
        const modal = modalStack.pushModal(constructor, state)
        modalStack.dirty()
        return modal as ModalType
    }


}
