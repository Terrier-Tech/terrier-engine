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