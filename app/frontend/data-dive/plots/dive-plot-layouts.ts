// mimic PlotLayout but with our own types
import DivePlotAxes, {DivePlotAxis} from "./dive-plot-axes"
import {PlotLayout} from "tuff-plot/layout"

/**
 * Same as PlotLayout but with our own types.
 */
export type DivePlotLayout = {
    axes?: {
        left?: DivePlotAxis
        top?: DivePlotAxis
        right?: DivePlotAxis
        bottom?: DivePlotAxis
    }
}

/// Conversion

/**
 * Convert a DivePlotLayout to a tuff-plot PlotLayout.
 * @param layout
 */
function toPlotLayout(diveLayout: DivePlotLayout): PlotLayout {
    const tuffLayout: PlotLayout = {}
    if (diveLayout.axes) {
        tuffLayout.axes = {}
        if (diveLayout.axes.left && diveLayout.axes.left.type !== 'none') {
            tuffLayout.axes.left = DivePlotAxes.toPlotAxis(diveLayout.axes.left)
        }
        if (diveLayout.axes.top && diveLayout.axes.top.type !== 'none') {
            tuffLayout.axes.top = DivePlotAxes.toPlotAxis(diveLayout.axes.top)
        }
        if (diveLayout.axes.right && diveLayout.axes.right.type !== 'none') {
            tuffLayout.axes.right = DivePlotAxes.toPlotAxis(diveLayout.axes.right)
        }
        if (diveLayout.axes.bottom && diveLayout.axes.bottom.type !== 'none') {
            tuffLayout.axes.bottom = DivePlotAxes.toPlotAxis(diveLayout.axes.bottom)
        }
    }
    return tuffLayout
}


/// Exports

const DivePlotLayouts = {
    toPlotLayout
}
export default DivePlotLayouts

