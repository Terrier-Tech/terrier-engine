import DbClient from "@tap/db-client"
import {ModelIncludesMap, ModelTypeMap} from "../gen/models"

/**
 * DbClient specifically for the dummy database.
 */
class DummyDb extends DbClient<ModelTypeMap, ModelIncludesMap> {}

export default function Db() {return new DummyDb()}