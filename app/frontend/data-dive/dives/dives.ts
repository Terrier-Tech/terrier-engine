import Api from "../../terrier/api"
import {DdDive, UnpersistedDdDive} from "../gen/models"
import Db from "../dd-db"
import DdSession from "../dd-session"
import {FilterInput} from "../queries/filters"
import Tables from "../queries/tables"
import {SchemaDef} from "../../terrier/schema"


////////////////////////////////////////////////////////////////////////////////
// Permissions
////////////////////////////////////////////////////////////////////////////////

/**
 * Only supers can delete other peoples' dives.
 * @param dive
 * @param session
 */
function canDelete(dive: UnpersistedDdDive, session: DdSession): boolean {
    return dive.owner_id == session.user.id || session.isSuper
}


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
// Inputs
////////////////////////////////////////////////////////////////////////////////

/**
 * Flatten all the filters from all the queries into a single array.
 * This approach introduces some limitations but I think it will yield the
 * desired result most of the time.
 * @param dive
 */
function computeFilterInputs(schema: SchemaDef, dive: DdDive): FilterInput[] {
    const filters: Record<string, FilterInput> = {}
    for (const query of dive.query_data?.queries || []) {
        Tables.computeFilterInputs(schema, query.from, filters)
    }
    return Object.values(filters)
}


////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Dives = {
    list,
    get,
    canDelete,
    computeFilterInputs
}

export default Dives