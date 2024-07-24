import {DdDive, DdDivePlot} from "../gen/models"
import Db from "../dd-db"
import {DivePlotAxis} from "./dive-plot-axes"


// mimic PlotLayout but with our own types
export type DivePlotLayout = {
    pad?: number
    axes?: {
        left?: DivePlotAxis
        top?: DivePlotAxis
        right?: DivePlotAxis
        bottom?: DivePlotAxis
    }

}
/**
 * Get all plots for the given dive.
 * @param dive
 */
async function get(dive: DdDive): Promise<DdDivePlot[]> {
    return await Db().query('dd_dive_plot')
        .where({dd_dive_id: dive.id, _state: 0})
        .orderBy("title ASC")
        .exec()
}


const DivePlots = {
    get
}
export default DivePlots