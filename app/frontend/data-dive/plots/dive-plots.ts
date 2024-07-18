
import {MarkerStyle, TraceStyle, TraceType, YAxisName} from "tuff-plot/trace"
import {PlotLayout} from "tuff-plot/layout"
import {DdDive, DdDivePlot} from "../gen/models"
import Db from "../dd-db"

/**
 * Similar to the tuff-plot Trace but not strongly typed to the data type since it's dynamically assigned to a query.
 */
export type DivePlotTrace = {
    id: string
    type: TraceType
    title: string
    query_id: string
    x: string
    y: string
    y_axis: YAxisName
    style?: TraceStyle
    marker?: MarkerStyle
}

// maybe we'll add more in the future
export type DivePlotLayout = PlotLayout

/**
 * Get all plots for the given dive.
 * @param dive
 */
async function get(dive: DdDive): Promise<DdDivePlot[]> {
    return await Db().query('dd_dive_plot')
        .where({dd_dive_id: dive.id})
        .orderBy("title ASC")
        .exec()
}


const DivePlots = {
    get
}
export default DivePlots