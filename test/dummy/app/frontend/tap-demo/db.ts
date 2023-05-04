import DbClient from "@terrier/db-client"
import {ModelIncludesMap, PersistedModelTypeMap, UnpersistedModelTypeMap} from "../gen/models"

/**
 * DbClient specifically for the dummy database.
 */
class DummyDb extends DbClient<PersistedModelTypeMap, UnpersistedModelTypeMap, ModelIncludesMap> {}

export default function Db() {return new DummyDb()}