import DbClient from "../terrier/db-client"
import {ModelIncludesMap, PersistedModelTypeMap, UnpersistedModelTypeMap} from "./gen/models"

/**
 * DbClient specifically for the data-dive database.
 */
class DdDb extends DbClient<PersistedModelTypeMap, UnpersistedModelTypeMap, ModelIncludesMap> {
}

export default function Db() {
    return new DdDb()
}