import Api from "./api"

////////////////////////////////////////////////////////////////////////////////
// Column Types
////////////////////////////////////////////////////////////////////////////////

type d = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 0
type YYYY = `19${d}${d}` | `20${d}${d}`
type oneToNine = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
type MM = `0${oneToNine}` | `1${0 | 1 | 2}`
type DD = `${0}${oneToNine}` | `${1 | 2}${d}` | `3${0 | 1}`

/**
 * YYYY-MM month literal.
 */
export type MonthLiteral = `${YYYY}-${MM}`

/**
 * YYYY-MM-DD date literal.
 */
export type DateLiteral = `${MonthLiteral}-${DD}`


////////////////////////////////////////////////////////////////////////////////
// Schema Definitions
////////////////////////////////////////////////////////////////////////////////

/**
 * Definition for a single column in the schema.
 */
export type ColumnDef = {
    name: string
    nullable: boolean
    array: boolean
    type: string
    possible_values?: string[]
    default?: string
}

/**
 * Definition for a single belongs_to relationship.
 */
export type BelongsToDef = {
    name: string
    model: string
    optional: boolean
}

/**
 * Definition for a single has_many relationship.
 */
export type HasManyDef = {
    name: string
    model: string
}

/**
 * Definition for a single model in the schema.
 */
export type ModelDef = {
    table_name: string
    columns: Record<string, ColumnDef>
    belongs_to: Record<string, BelongsToDef>
    has_many: Record<string, HasManyDef>
}

/**
 * Definition for an entire schema.
 */
export type SchemaDef = {
    models: ModelDef
}


////////////////////////////////////////////////////////////////////////////////
// Get Schema
////////////////////////////////////////////////////////////////////////////////

async function get(): Promise<SchemaDef> {
    const res = await Api.safeGet<{schema: SchemaDef}>("/db/schema.json", {})
    return res.schema
}

const Schema = {
    get
}

export default Schema