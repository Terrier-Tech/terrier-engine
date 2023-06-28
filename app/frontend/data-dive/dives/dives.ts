import Api from "../../terrier/api"
import {DdDive} from "../gen/models"
import Db from "../dd-db"


////////////////////////////////////////////////////////////////////////////////
// Endpoints
////////////////////////////////////////////////////////////////////////////////

/**
 * Get a dive by id.
 * @param id can be 'test' to get the test dive
 */
async function get(id: string): Promise<DdDive> {
    if (id == 'test') {
        const res = await Api.safeGet<{ dive: DdDive }>(`/data_dive/test_dive.json`, {})
        return res.dive
    } else {
        return Db().find("dd_dive", id, {owner: {}})
    }
}


export type DiveListResult = {
    dives: DdDive[]
}

async function list(): Promise<DiveListResult> {
    return await Api.safeGet(`/data_dive/list.json`, {})
}

////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Dives = {
    list,
    get
}

export default Dives