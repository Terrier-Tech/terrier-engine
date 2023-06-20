import {Query} from "../queries/queries"
import Api from "../../terrier/api"
import {arrays} from "tuff-core"


export type Dive = {
    id: string
    name: string
    description_raw: string
    queries: Query[]
}

async function get(id: string): Promise<Dive> {
    if (id == 'test') {
        const res = await Api.safeGet<{ dive: Dive }>(`/data_dive/test_dive.json`, {})
        return res.dive
    } else {
        throw `Don't know how to actually get queries`
    }
}

/**
 * Deletes the query with the given id from the dive.
 * @param dive
 * @param id
 * @return true if there was a query with that id
 */
function deleteQuery(dive: Dive, id: string) {
    return arrays.deleteIf(dive.queries, q => q.id == id) > 0
}


const Dives = {
    get,
    deleteQuery
}

export default Dives