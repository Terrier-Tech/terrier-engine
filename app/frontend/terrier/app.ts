import {Logger} from "tuff-core/logging"
import {Part, PartConstructor, PartParent} from "tuff-core/parts"
import TerrierPart from "./parts/terrier-part"
import Tooltips from "./tooltips"
import Lightbox from "./lightbox"
import Theme from "./theme"
import {ModalPart, ModalStackPart} from "./modals"
import {OverlayLayerType, OverlayPart} from "./overlays"
import Messages from "tuff-core/messages"

// @ts-ignore
import logoUrl from './images/optimized/terrier-hub-logo-light.svg'
import Sheets, {AlertSheetState, ConfirmSheetState, Sheet, SheetState} from "./sheets"


const log = new Logger('App')

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


    /// Sheets

    /**
     * Shows a confirm sheet to the user, asking them a question
     * @param options
     * @param callback gets called if the user hits "Confirm"
     */
    confirm(options: ConfirmSheetState, callback: () => any) {
        const key = Messages.untypedKey()
        const state = {...options,
            primaryActions: [
                {
                    title: 'Confirm',
                    icon: 'glyp-checkmark',
                    click: {key}
                }
            ],
            secondaryActions: [
                {
                    title: 'Cancel',
                    icon: 'glyp-close',
                    classes: ['secondary'],
                    click: {key: Sheets.clearKey}
                }
            ]
        } as SheetState
        const sheet = this.overlayPart.getOrCreateLayer(Sheet<SheetState>, state, 'sheet')
        sheet.onClick(key, _ => {
            sheet.clear()
            callback()
        })
        sheet.dirty()
    }

    /**
     * Shows an alert sheet to the user with a message (but no choices).
     * @param options
     */
    alert(options: AlertSheetState) {
        const state = {...options,
            primaryActions: [
                {
                    title: 'Okay',
                    icon: 'glyp-checkmark',
                    click: {key: Sheets.clearKey},
                    classes: ['secondary']
                }
            ]
        } as SheetState
        const sheet = this.overlayPart.getOrCreateLayer(Sheet<SheetState>, state, 'sheet')
        sheet.dirty()
    }


}
