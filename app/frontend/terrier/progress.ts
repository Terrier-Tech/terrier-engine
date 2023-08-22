import TerrierPart from "./parts/terrier-part"
import {PartTag} from "tuff-core/parts"
import {ColorName} from "./theme"

export type ProgressState = {
    total: number
}

/**
 * Renders a horizontal progress bar with width controlled by the `progress` field.
 */
export class ProgressBarPart extends TerrierPart<ProgressState> {

    progress = 0
    color: ColorName = 'primary'

    /**
     * Set the total number of steps.
     * @param total
     */
    setTotal(total: number) {
        this.state.total = total
        this.progress = Math.min(this.progress, this.state.total)
        this.dirty()
    }

    /**
     * Sets the progress and (optionally) color, then dirties the part.
     * @param progress
     * @param color
     */
    setProgress(progress: number, color?: ColorName) {
        this.progress = progress
        if (color) {
            this.color = color
        }
        this.dirty()
    }

    /**
     * Increments the progress by one.
     */
    increment() {
        this.progress += 1
        this.dirty()
    }

    /**
     * Sets the progress to the total and optionally changes the color.
     * @param color
     */
    complete(color?: ColorName) {
        this.progress = this.state.total
        if (color) {
            this.color = color
        }
        this.dirty()
    }

    get parentClasses(): Array<string> {
        return ['tt-progress-bar']
    }

    render(parent: PartTag): any {
        parent.div('.gutter', gutter => {
            const width = (this.progress / this.state.total) * 100
            gutter.div('.bar', this.color).css({width: `${width}%`})
        })
    }

}