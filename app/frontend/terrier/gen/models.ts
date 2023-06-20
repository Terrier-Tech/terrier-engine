// This file was automatically generated, DO NOT EDIT IT MANUALLY!

import { Query } from "../../data-dive/queries/queries"

import { OptionalProps } from "tuff-core/types"

export type DdDive = {
    id: string
    created_at: string
    updated_at: string
    _state: number
    created_by_id?: string
    created_by_name: string
    extern_id?: string
    updated_by_id?: string
    updated_by_name?: string
    owner_id?: string
    dd_dive_group_id?: string
    name: string
    description_raw?: string
    description_html?: string
    visibility: "public" | "private"
    sort_order?: number
    query_data?: { queries: Query[] }
    created_by?: User
    updated_by?: User
    dd_dive_group?: DdDiveGroup
    dd_dive_runs?: DdDiveRun[]
    owner?: User
}

export type UnpersistedDdDive = {
    id?: string
    created_at?: string
    updated_at?: string
    _state?: number
    created_by_id?: string
    created_by_name?: string
    extern_id?: string
    updated_by_id?: string
    updated_by_name?: string
    owner_id?: string
    dd_dive_group_id?: string
    name: string
    description_raw?: string
    description_html?: string
    visibility: "public" | "private"
    sort_order?: number
    query_data?: { queries: Query[] }
    created_by?: User
    updated_by?: User
    dd_dive_group?: DdDiveGroup
    dd_dive_runs?: OptionalProps<UnpersistedDdDiveRun, "dd_dive_id">[]
    owner?: User
}

export const DdDiveEnumFields = {
    visibility: ["public", "private"] as const,
}

export type DdDiveGroup = {
    id: string
    created_at: string
    updated_at: string
    _state: number
    created_by_id?: string
    created_by_name: string
    extern_id?: string
    updated_by_id?: string
    updated_by_name?: string
    name: string
    icon?: string
    description_raw?: string
    description_html?: string
    sort_order?: number
    group_types: string[]
    created_by?: User
    updated_by?: User
    dd_dives?: DdDive[]
}

export type UnpersistedDdDiveGroup = {
    id?: string
    created_at?: string
    updated_at?: string
    _state?: number
    created_by_id?: string
    created_by_name?: string
    extern_id?: string
    updated_by_id?: string
    updated_by_name?: string
    name: string
    icon?: string
    description_raw?: string
    description_html?: string
    sort_order?: number
    group_types: string[]
    created_by?: User
    updated_by?: User
    dd_dives?: OptionalProps<UnpersistedDdDive, "dd_dive_group_id">[]
}

export type DdDiveRun = {
    id: string
    created_at: string
    updated_at: string
    _state: number
    created_by_id?: string
    created_by_name: string
    extern_id?: string
    updated_by_id?: string
    updated_by_name?: string
    dd_dive_id?: string
    input_data?: object
    output_data?: object
    status: "running" | "success" | "error"
    created_by?: User
    updated_by?: User
    dd_dive?: DdDive
    output_file?: File
}

export type UnpersistedDdDiveRun = {
    id?: string
    created_at?: string
    updated_at?: string
    _state?: number
    created_by_id?: string
    created_by_name?: string
    extern_id?: string
    updated_by_id?: string
    updated_by_name?: string
    dd_dive_id?: string
    input_data?: object
    output_data?: object
    status: "running" | "success" | "error"
    created_by?: User
    updated_by?: User
    dd_dive?: DdDive
    output_file?: File
}

export const DdDiveRunEnumFields = {
    status: ["running", "success", "error"] as const,
}

export type Script = {
    id: string
    created_at: string
    updated_at: string
    _state: number
    created_by_id?: string
    created_by_name: string
    extern_id?: string
    updated_by_id?: string
    updated_by_name?: string
    body?: string
    title: string
    description?: string
    email_recipients?: string[]
    script_fields?: object
    report_category?: "admin" | "locations" | "miscellaneous" | "none"
    schedule_rules?: object
    schedule_rule_summaries?: string[]
    schedule_time: "none" | "evening" | "morning" | "7" | "8" | "9" | "10" | "11" | "12" | "13" | "14" | "15" | "16" | "17" | "18"
    num_per_year: number
    schedule_type: string
    order_grouping: "combine" | "separate"
    visibility: "public" | "private"
    org_id?: string
    created_by?: User
    updated_by?: User
    script_runs?: ScriptRun[]
}

export type UnpersistedScript = {
    id?: string
    created_at?: string
    updated_at?: string
    _state?: number
    created_by_id?: string
    created_by_name?: string
    extern_id?: string
    updated_by_id?: string
    updated_by_name?: string
    body?: string
    title: string
    description?: string
    email_recipients?: string[]
    script_fields?: object
    report_category?: "admin" | "locations" | "miscellaneous" | "none"
    schedule_rules?: object
    schedule_rule_summaries?: string[]
    schedule_time: "none" | "evening" | "morning" | "7" | "8" | "9" | "10" | "11" | "12" | "13" | "14" | "15" | "16" | "17" | "18"
    num_per_year: number
    schedule_type: string
    order_grouping: "combine" | "separate"
    visibility: "public" | "private"
    org_id?: string
    created_by?: User
    updated_by?: User
    script_runs?: OptionalProps<UnpersistedScriptRun, "script_id">[]
}

export const ScriptEnumFields = {
    order_grouping: ["combine", "separate"] as const,
    report_category: ["admin", "locations", "miscellaneous", "none"] as const,
    schedule_time: ["none", "evening", "morning", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18"] as const,
    visibility: ["public", "private"] as const,
}

export type ScriptRun = {
    id: string
    created_at: string
    updated_at: string
    _state: number
    created_by_id?: string
    created_by_name: string
    extern_id?: string
    updated_by_id?: string
    updated_by_name?: string
    duration?: number
    exception?: string
    backtrace?: string[]
    fields?: object
    log_file_name?: string
    log_content_type?: string
    log_file_size?: number
    log_updated_at?: string
    status: "running" | "success" | "error" | "cancelled" | "cleared"
    script_id: string
    org_id?: string
    script_body?: string
    created_by?: User
    updated_by?: User
    script?: Script
}

export type UnpersistedScriptRun = {
    id?: string
    created_at?: string
    updated_at?: string
    _state?: number
    created_by_id?: string
    created_by_name?: string
    extern_id?: string
    updated_by_id?: string
    updated_by_name?: string
    duration?: number
    exception?: string
    backtrace?: string[]
    fields?: object
    log_file_name?: string
    log_content_type?: string
    log_file_size?: number
    log_updated_at?: string
    status: "running" | "success" | "error" | "cancelled" | "cleared"
    script_id: string
    org_id?: string
    script_body?: string
    created_by?: User
    updated_by?: User
    script?: Script
}

export const ScriptRunEnumFields = {
    status: ["running", "success", "error", "cancelled", "cleared"] as const,
}

export type User = {
    id: string
    created_at: string
    updated_at: string
    _state: number
    created_by_id?: string
    created_by_name: string
    extern_id?: string
    updated_by_id?: string
    updated_by_name?: string
    address1?: string
    address2?: string
    city?: string
    county?: string
    email?: string
    first_name: string
    last_logged_in_at?: string
    last_name: string
    notes_html?: string
    notes_raw?: string
    password_digest: string
    password_reset_token?: string
    password_reset_token_expires_at?: string
    role: "technician" | "office" | "customer"
    state?: string
    tags: string[]
    zip?: string
    created_by?: User
    updated_by?: User
}

export type UnpersistedUser = {
    id?: string
    created_at?: string
    updated_at?: string
    _state?: number
    created_by_id?: string
    created_by_name?: string
    extern_id?: string
    updated_by_id?: string
    updated_by_name?: string
    address1?: string
    address2?: string
    city?: string
    county?: string
    email?: string
    first_name: string
    last_logged_in_at?: string
    last_name: string
    notes_html?: string
    notes_raw?: string
    password_digest: string
    password_reset_token?: string
    password_reset_token_expires_at?: string
    role: "technician" | "office" | "customer"
    state?: string
    tags: string[]
    zip?: string
    created_by?: User
    updated_by?: User
}

export const UserEnumFields = {
    role: ["technician", "office", "customer"] as const,
}

/**
 * Map model names to their types.
 */
export type PersistedModelTypeMap = {
    dd_dive: DdDive
    dd_dive_group: DdDiveGroup
    dd_dive_run: DdDiveRun
    script: Script
    script_run: ScriptRun
    user: User
}

/**
 * Map model names to their unpersisted types.
 */
export type UnpersistedModelTypeMap = {
    dd_dive: UnpersistedDdDive
    dd_dive_group: UnpersistedDdDiveGroup
    dd_dive_run: UnpersistedDdDiveRun
    script: UnpersistedScript
    script_run: UnpersistedScriptRun
    user: UnpersistedUser
}

/**
 * Map model names to their association names.
 */
export type ModelIncludesMap = {
    dd_dive: "created_by" | "dd_dive_group" | "dd_dive_runs" | "owner" | "updated_by"
    dd_dive_group: "created_by" | "dd_dives" | "updated_by"
    dd_dive_run: "created_by" | "dd_dive" | "updated_by"
    script: "created_by" | "script_runs" | "updated_by"
    script_run: "created_by" | "script" | "updated_by"
    user: "contacts" | "created_by" | "updated_by" | "work_orders"
}

/**
 * Map "sluggable" model names to their types
 */
export type SluggableModelTypeMap = {}

/**
 * A type consisting of all possible model names.
 */
export type ModelName = keyof PersistedModelTypeMap & keyof UnpersistedModelTypeMap
