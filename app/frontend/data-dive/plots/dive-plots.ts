import {DdDive, DdDivePlot} from "../gen/models"
import Db from "../dd-db"

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

/**
 * Soft delete a plot.
 * @param plot
 */
async function softDelete(plot: DdDivePlot) {
    plot._state = 2
    return await Db().update('dd_dive_plot', plot)
}


const DivePlots = {
    get,
    softDelete
}
export default DivePlots