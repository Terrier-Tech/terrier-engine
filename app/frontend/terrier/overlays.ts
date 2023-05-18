import { Part, PartParent, PartTag, StatelessPart, NoState } from "tuff-core/parts"
import { Size, Box, Side } from "tuff-core/box"
import { Logger } from "tuff-core/logging"

const log = new Logger('Overlays')

////////////////////////////////////////////////////////////////////////////////
// Part
////////////////////////////////////////////////////////////////////////////////

const OverlayLayers = ['modal', 'dropdown', 'lightbox', 'jump'] as const

/**
 * Which overlay layer to use for an overlay part.
 * There can only be one part per layer.
 */
export type OverlayLayer = typeof OverlayLayers[number]

export class OverlayPart extends Part<NoState> {

    parts: {[layer in OverlayLayer]?: StatelessPart} = {}

    /**
     * Creates a part at the given layer.
     * Discards the old part at that layer, if there was one.
     * @param constructor
     * @param state
     * @param layer
     */
    makeLayer<PartType extends Part<StateType>, StateType>(
        constructor: { new(p: PartParent, id: string, state: StateType): PartType; },
        state: StateType,
        layer: OverlayLayer
    ): PartType {
        const part = this.makePart(constructor, state)
        this.clearLayer(layer)
        this.parts[layer] = part
        return part
    }

    /**
     * Clear a single overlay layer.
     * @param layer
     */
    clearLayer(layer: OverlayLayer) {
        const layerPart = this.parts[layer]
        if (layerPart) {
            this.removeChild(layerPart)
            this.parts[layer] = undefined
        }
        this.dirty()
    }

    /**
     * Clear all overlay layers.
     */
    clearAll() {
        for (const layer of OverlayLayers) {
            this.clearLayer(layer)
        }
    }

    render(parent: PartTag) {
        for (const layer of OverlayLayers) {
            const part = this.parts[layer]
            if (part) {
                parent.div(layer).part(part)
            }
        }
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