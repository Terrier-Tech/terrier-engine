import {Part, PartTag, StatelessPart, NoState, PartConstructor} from "tuff-core/parts"
import { Size, Box, Side } from "tuff-core/box"
import { Logger } from "tuff-core/logging"
import {arrays} from "tuff-core";

const log = new Logger('Overlays')

////////////////////////////////////////////////////////////////////////////////
// Part
////////////////////////////////////////////////////////////////////////////////

const OverlayLayerTypes = ['modal', 'dropdown', 'lightbox', 'jump'] as const

/**
 * The type of overlay for any given layer.
 */
export type OverlayLayerType = typeof OverlayLayerTypes[number]

export class OverlayPart extends Part<NoState> {

    layerStates: OverlayLayerState<any, any>[] = []

    updateLayers(): StatelessPart[] {
        return this.assignCollection('layers', OverlayLayer, this.layerStates)
    }

    /**
     * Creates a part and pushes it onto the overlay stack.
     * @param constructor
     * @param state
     * @param type
     * @return the new part
     */
    pushLayer<PartType extends Part<StateType>, StateType extends {}>(
        constructor: PartConstructor<PartType, StateType>,
        state: StateType,
        type: OverlayLayerType
    ): PartType {
        this.layerStates.push({partClass: constructor, partState: state, type})
        const parts = this.updateLayers()
        return (parts[parts.length-1] as OverlayLayer<PartType, StateType>).part as PartType
    }

    /**
     * Same as `pushLayer`, except that it will re-use the first existing layer of the given type, if present.
     * @param constructor
     * @param state
     * @param type
     * @return the new or existing part
     */
    getOrCreateLayer<PartType extends Part<StateType>, StateType extends {}>(
        constructor: PartConstructor<PartType, StateType>,
        state: StateType,
        type: OverlayLayerType
    ): PartType {
        const layers = this.getCollectionParts('layers')
        for (const layer of layers) {
            if (layer.state.type == type) {
                return (layer as OverlayLayer<PartType, StateType>).part as PartType
            }
        }
        const part = this.pushLayer(constructor, state, type)
        return part as PartType
    }

    /**
     * Pops the top layer off the overlay stack.
     * @return the part that was popped, if there was one.
     */
    popLayer(type?: OverlayLayerType): StatelessPart | undefined {
        const oldParts = this.getCollectionParts('layers')
        if (type) {
            for (let i = this.layerStates.length-1; i>=0; i--) {
                if (this.layerStates[i].type == type) {
                    const part = oldParts[i]
                    this.layerStates = arrays.without(this.layerStates, this.layerStates[i])
                    this.updateLayers()
                    return part
                }
            }
            return undefined
        }
        else {
            // no type specified, pop the top one
            this.layerStates = this.layerStates.slice(0, this.layerStates.length - 1)
            this.updateLayers()
            return oldParts[oldParts.length - 1]
        }
    }

    /**
     * Removes the layer with the given state from the stack.
     * @param state
     * @return true if there was a layer actually removed
     */
    removeLayer<StateType extends {}>(state: StateType): boolean {
        for (const layerState of this.layerStates) {
            if (layerState.partState == state) {
                this.layerStates = arrays.without(this.layerStates, layerState)
                this.updateLayers()
                return true
            }
        }
        return false
    }

    /**
     * Clear all overlay layers.
     */
    clearAll() {
        this.layerStates = []
    }

    render(parent: PartTag) {
        this.renderCollection(parent, 'layers')
    }

}

type OverlayLayerState<PartType extends Part<StateType>, StateType extends {}> = {
    partClass: PartConstructor<PartType, StateType>
    partState: StateType
    type: OverlayLayerType
}

class OverlayLayer<PartType extends Part<StateType>, StateType extends {}> extends Part<OverlayLayerState<PartType, StateType>> {

    part!: PartType

    async init() {
        this.part = this.makePart(this.state.partClass, this.state.partState)
    }

    render(parent: PartTag) {
        parent.part(this.part)
    }


}


////////////////////////////////////////////////////////////////////////////////
// Anchoring
////////////////////////////////////////////////////////////////////////////////

type AnchorResult = {
    left: number
    top: number
    width?: number,
    height?: number,
    valid: boolean
}

function clampHorizontal(result: AnchorResult, size: Size, container: Size) {
    if (container.width < size.width) {
        result.width = container.width
    }
    const rightOffset = container.width - (result.width ?? size.width) // don't hang off the right side of the viewport
    result.left = Math.max(0, Math.min(result.left, rightOffset)) // don't hang off the left side of the viewport
    if (result.top < 0 || result.top+size.height > container.height) {
        result.valid = false
    }
}

function anchorBoxBottom(size: Size, anchor: Box, container: Size): AnchorResult {
    const result = {
        top: anchor.y + anchor.height,
        left: anchor.x + anchor.width / 2 - size.width / 2,
        valid: true
    }
    clampHorizontal(result, size, container)
    return result
}

function anchorBoxTop(size: Size, anchor: Box, container: Size): AnchorResult {
    const result = {
        top: anchor.y - size.height,
        left: anchor.x + anchor.width / 2 - size.width / 2,
        valid: true
    }
    clampHorizontal(result, size, container)
    return result
}

function clampVertical(result: AnchorResult, size: Size, container: Size) {
    if (container.height < size.height) {
        result.height = container.height
    }
    const bottomOffset = container.height - (result.height ?? size.height) // don't hang off the bottom of the viewport
    result.top = Math.max(0, Math.min(result.top, bottomOffset)) // don't hang off the top of the viewport
    if (result.left < 0 || result.left + size.width > container.width) {
        result.valid = false
    }
}

function anchorBoxLeft(size: Size, anchor: Box, container: Size): AnchorResult {
    const result = {
        top: anchor.y + anchor.height/2 - size.height / 2,
        left: anchor.x - size.width,
        valid: true
    }
    clampVertical(result, size, container)
    return result
}

function anchorBoxRight(size: Size, anchor: Box, container: Size): AnchorResult {
    const result = {
        top: anchor.y + anchor.height/2 - size.height / 2,
        left: anchor.x + anchor.width,
        valid: true
    }
    clampVertical(result, size, container)
    return result
}

function anchorBoxSide(size: Size, anchor: Box, container: Size, side: Side): AnchorResult {
    switch (side) {
        case 'bottom':
            return anchorBoxBottom(size, anchor, container)
        case 'top':
            return anchorBoxTop(size, anchor, container)
        case 'left':
            return anchorBoxLeft(size, anchor, container)
        case 'right':
            return anchorBoxRight(size, anchor, container)
    }
}

export type AnchorOptions = {
    preferredSide: Side
}

/**
 * Computes an anchored position for a box of the given size to the anchor.
 * @param size the size of the box to be anchored
 * @param anchor the anchor box itself
 * @param container the size of the container (presumably the window)
 * @param options
 * @return a left/top combination representing the new anchored position
 */
function anchorBox(size: Size, anchor: Box, container: Size, options: AnchorOptions): AnchorResult {
    // try the preferred side first
    const preferredResult = anchorBoxSide(size, anchor, container, options.preferredSide)
    if (preferredResult.valid) {
        return preferredResult
    }

    // try other sides
    for (const side of ['bottom', 'top', 'right', 'left'] as const) {
        if (side == options.preferredSide) {
            continue
        }
        const result = anchorBoxSide(size, anchor, container, side)
        if (result.valid) {
            return result
        }
    }

    // none of the sides were valid, just use the preferred one, I guess
    return preferredResult
}

/**
 * Anchors one element to the side of another.
 * @param elem the element to reposition
 * @param anchor the anchor element
 */
function anchorElement(elem: HTMLElement, anchor: HTMLElement) {
    // Sometimes the actual width and height of the rendered element is incorrect before we set the style attribute.
    // Setting the style attribute first forces the browser to re-calculate the size of the element so that we can use
    // the "real" size to calculate where to anchor the element.
    elem.setAttribute('style', 'top:0;left:0;')

    const elemSize = {
        width: elem.offsetWidth,
        height: elem.offsetHeight
    }
    log.debug(`Anchoring element`, elem, anchor)
    const rect = anchor.getBoundingClientRect()
    const win = {width: window.innerWidth, height: window.innerHeight }
    const anchorResult = anchorBox(elemSize, rect, win, {preferredSide: 'bottom'})

    let styleString = ""
    for (const key of ['top', 'left', 'width', 'height'] as const) {
        if (anchorResult[key] != null) {
            styleString += `${key}: ${anchorResult[key]}px;`
        }
    }
    elem.setAttribute('style', styleString)
}


////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Overlays = {
    anchorElement,
    anchorBox
}

export default Overlays