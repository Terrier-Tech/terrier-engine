import Api from "./api"
import inflection from "inflection";

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
    name: string
    table_name: string
    columns: Record<string, ColumnDef>
    belongs_to: Record<string, BelongsToDef>
    has_many: Record<string, HasManyDef>
    metadata?: {
        description?: string
        common?: boolean
    }
}

/**
 * Definition for an entire schema.
 */
export type SchemaDef = {
    models: Record<string, ModelDef>
}


////////////////////////////////////////////////////////////////////////////////
// Get Schema
////////////////////////////////////////////////////////////////////////////////

async function get(): Promise<SchemaDef> {
    const res = await Api.safeGet<{schema: SchemaDef}>("/db/schema.json", {})
    return res.schema
}


////////////////////////////////////////////////////////////////////////////////
// Utilities
////////////////////////////////////////////////////////////////////////////////

/**
 * Generated a string used to display a `BelongsToDef` to the user.
 * If the name differs from the model, the name will be included in parentheses.
 * @param belongsTo
 */
function belongsToDisplay(belongsTo: BelongsToDef): string {
    if (belongsTo.name != inflection.singularize(inflection.tableize(belongsTo.model))) {
        // the model is different than the name of the association
        return `${belongsTo.model} (${belongsTo.name})`
    }
    else {
        return belongsTo.model
    }
}


////////////////////////////////////////////////////////////////////////////////
// Meta
////////////////////////////////////////////////////////////////////////////////

/**
 * Gets all models with common=true in the metadata.
 * @param schema
 */
function commonModels(schema: SchemaDef): ModelDef[] {
    return Object.values(schema.models).filter(m => m.metadata?.common)
}

/**
 * Gets all models with common=false (or not defined) in the metadata.
 * @param schema
 */
function uncommonModels(schema: SchemaDef): ModelDef[] {
    return Object.values(schema.models).filter(m => !(m.metadata?.common))
}


////////////////////////////////////////////////////////////////////////////////
// Export
////////////////////////////////////////////////////////////////////////////////

const Schema = {
    get,
    belongsToDisplay,
    commonModels,
    uncommonModels
}

export default Schema