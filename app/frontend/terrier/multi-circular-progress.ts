import {PartTag} from "tuff-core/parts"
import TerrierPart from "./parts/terrier-part"

type OneToFive<T> = T | [T, T] | [T, T, T] | [T, T, T, T] | [T, T, T, T, T]

export type MultiCircularProgressState = {
    /** The total amount represented by the progress bar */
    total: number
    /** Current progress trace(es) of the progress bar */
    progress: OneToFive<number>
    /** Options modifying the appearance and behavior of the progress bar */
    options?: MultiCircularProgressOptions
}

export type MultiCircularProgressOptions = {
    /** Colors of each trace in the progress bar. Any css color string can be used here. */
    color?: OneToFive<string>
    /** The width and height of the circle. If not provided, the circle will fill its container. Any css length string can be used here. */
    outerDiameter?: string
    /** The thickness of the ring. If not provided, 10px. Any css length string can be used here. */
    thickness?: string
    /** The color of the ring when it is not filled. Default is --tt-inactive-color. Any css color string can be used here. */
    backgroundColor?: string
    /** The duration of the transition when progress changes. Default is --tt-transition-duration. Any css duration string can be used here. */
    transitionDuration?: string
    /** The timing function used for the transition when progress changes. Any css timing function can be used here. */
    transitionTimingFunction?: string
}

/**
 * An animated circular progress bar.
 * Supports up to 5 simultaneous progress values. Progress values are assumed to sum to the total or less
 */
export default class MultiCircularProgressBarPart extends TerrierPart<MultiCircularProgressState> {

    updateProgress(progress: OneToFive<number>) {
        const oldProgress = this.state.progress;
        const newIsArray = Array.isArray(progress)
        const oldIsArray = Array.isArray(oldProgress)
        const newType = newIsArray !== oldIsArray
        const countDiff = newIsArray && oldIsArray && progress.length != oldProgress.length
        if (newType || countDiff) {
            this.assignState({ ...this.state, progress })
            return
        }

        this.state.progress = progress
        this.stale()
    }

    render(parent: PartTag) {
        parent.div('tt-circle-progress')
    }

    update(elem: HTMLElement) {
        super.update(elem);

        const bar = elem.querySelector('.tt-circle-progress') as HTMLElement

        if (Array.isArray(this.state.progress)) {
            let amount = 0
            for (let i = 0; i < this.state.progress.length; i++) {
                amount += this.state.progress[i] / this.state.total
                bar.style.setProperty(`--progress-${i}-value`, `${amount * 100}%`)
            }
        } else {
            bar.style.setProperty('--progress-0-value', `${this.state.progress / this.state.total * 100}%`)

        }

        if (!this.state.options) return

        if (this.state.options.outerDiameter) bar.style.setProperty('--size', this.state.options.outerDiameter)
        if (this.state.options.thickness) bar.style.setProperty('--thickness', this.state.options.thickness)
        if (this.state.options.backgroundColor) bar.style.setProperty('--background-color', this.state.options.backgroundColor)
        if (this.state.options.transitionDuration) bar.style.setProperty('--transition-duration', this.state.options.transitionDuration)
        if (this.state.options.transitionTimingFunction) bar.style.setProperty('--transition-timing-function', this.state.options.transitionTimingFunction)

        if (Array.isArray(this.state.options?.color)) {
            for (let i = 0; i < this.state.options.color.length; i++) {
                bar.style.setProperty(`--progress-${i}-color`, this.state.options.color[i])
            }
        } else if (this.state.options?.color) {
            bar.style.setProperty(`--progress-0-color`, this.state.options.color)
        }
    }
}