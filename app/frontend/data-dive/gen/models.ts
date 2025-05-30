// This file was automatically generated on 2025-04-25 14:11:58 -0500, DO NOT EDIT IT MANUALLY!

import { Query } from "../queries/queries"

import { DdUser } from "../dd-user"

import { FilterInput } from "../queries/filters"

import { Attachment } from "../../terrier/attachments"

import { RegularSchedule } from "../../terrier/schedules"

import { DivePlotLayout } from "../plots/dive-plot-layouts"

import { DivePlotTrace } from "../plots/dive-plot-traces"

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
    dive_types: string[]
    delivery_mode?: string
    delivery_recipients?: string[]
    delivery_schedule?: RegularSchedule
    created_by?: DdUser
    updated_by?: DdUser
    dd_dive_group?: DdDiveGroup
    dd_dive_runs?: DdDiveRun[]
    owner?: DdUser
    dd_dive_distributions?: DdDiveDistribution[]
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
    dive_types: string[]
    delivery_mode?: string
    delivery_recipients?: string[]
    delivery_schedule?: RegularSchedule
    created_by?: DdUser
    updated_by?: DdUser
    dd_dive_group?: DdDiveGroup
    dd_dive_runs?: OptionalProps<UnpersistedDdDiveRun, "dd_dive_id">[]
    owner?: DdUser
    dd_dive_distributions?: OptionalProps<UnpersistedDdDiveDistribution, "dd_dive_id">[]
}

export const DdDiveEnumFields = {
    visibility: ["public", "private"] as const,
}

export type DdDiveDistribution = {
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
    recipients?: string[]
    schedule: RegularSchedule
    notes?: string
    created_by?: DdUser
    updated_by?: DdUser
    dd_dive_runs?: DdDiveRun[]
    dd_dive?: DdDive
}

export type UnpersistedDdDiveDistribution = {
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
    recipients?: string[]
    schedule: RegularSchedule
    notes?: string
    created_by?: DdUser
    updated_by?: DdUser
    dd_dive_runs?: OptionalProps<UnpersistedDdDiveRun, "dd_dive_distribution_id">[]
    dd_dive?: DdDive
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
    created_by?: DdUser
    updated_by?: DdUser
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
    created_by?: DdUser
    updated_by?: DdUser
    dd_dives?: OptionalProps<UnpersistedDdDive, "dd_dive_group_id">[]
}

export type DdDivePlot = {
    id: string
    created_at: string
    updated_at: string
    _state: number
    created_by_id?: string
    created_by_name: string
    extern_id?: string
    updated_by_id?: string
    updated_by_name?: string
    title: string
    traces: DivePlotTrace[]
    layout: DivePlotLayout
    dd_dive_id: string
    created_by?: DdUser
    updated_by?: DdUser
    dd_dive?: DdDive
}

export type UnpersistedDdDivePlot = {
    id?: string
    created_at?: string
    updated_at?: string
    _state?: number
    created_by_id?: string
    created_by_name?: string
    extern_id?: string
    updated_by_id?: string
    updated_by_name?: string
    title: string
    traces: DivePlotTrace[]
    layout: DivePlotLayout
    dd_dive_id: string
    created_by?: DdUser
    updated_by?: DdUser
    dd_dive?: DdDive
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
    input_data?: { queries: Query[]; filters: FilterInput[] }
    output_data?: object
    output_file_data?: Attachment | { path: string }
    status: "initial" | "running" | "success" | "error"
    delivery_mode?: string
    delivery_recipients?: string[]
    delivery_data?: object
    dd_dive_distribution_id?: string
    created_by?: DdUser
    updated_by?: DdUser
    dd_dive?: DdDive
    dd_dive_distribution?: DdDiveDistribution
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
    input_data?: { queries: Query[]; filters: FilterInput[] }
    output_data?: object
    output_file_data?: Attachment | { path: string }
    status: "initial" | "running" | "success" | "error"
    delivery_mode?: string
    delivery_recipients?: string[]
    delivery_data?: object
    dd_dive_distribution_id?: string
    created_by?: DdUser
    updated_by?: DdUser
    dd_dive?: DdDive
    dd_dive_distribution?: DdDiveDistribution
    output_file?: File
}

export const DdDiveRunEnumFields = {
    status: ["initial", "running", "success", "error"] as const,
}

/**
 * Map model names to their types.
 */
export type PersistedModelTypeMap = {
    dd_dive: DdDive
    dd_dive_distribution: DdDiveDistribution
    dd_dive_group: DdDiveGroup
    dd_dive_plot: DdDivePlot
    dd_dive_run: DdDiveRun
}

/**
 * Map model names to their unpersisted types.
 */
export type UnpersistedModelTypeMap = {
    dd_dive: UnpersistedDdDive
    dd_dive_distribution: UnpersistedDdDiveDistribution
    dd_dive_group: UnpersistedDdDiveGroup
    dd_dive_plot: UnpersistedDdDivePlot
    dd_dive_run: UnpersistedDdDiveRun
}

/**
 * Map model names to their association names.
 */
export type ModelIncludesMap = {
    dd_dive: "created_by" | "dd_dive_distributions" | "dd_dive_group" | "dd_dive_runs" | "owner" | "updated_by"
    dd_dive_distribution: "created_by" | "dd_dive" | "dd_dive_runs" | "updated_by"
    dd_dive_group: "created_by" | "dd_dives" | "updated_by"
    dd_dive_plot: "created_by" | "dd_dive" | "updated_by"
    dd_dive_run: "created_by" | "dd_dive" | "dd_dive_distribution" | "updated_by"
}

/**
 * Map model names to an array of association names.
 */
export const ModelIncludesArrayMap = {
    dd_dive: ["created_by", "dd_dive_distributions", "dd_dive_group", "dd_dive_runs", "owner", "updated_by"] as const,
    dd_dive_distribution: ["created_by", "dd_dive", "dd_dive_runs", "updated_by"] as const,
    dd_dive_group: ["created_by", "dd_dives", "updated_by"] as const,
    dd_dive_plot: ["created_by", "dd_dive", "updated_by"] as const,
    dd_dive_run: ["created_by", "dd_dive", "dd_dive_distribution", "updated_by"] as const,
}

/**
 * Map "sluggable" model names to their types
 */
export type SluggableModelTypeMap = {}

/**
 * A type consisting of all possible model names.
 */
export type ModelName = keyof PersistedModelTypeMap & keyof UnpersistedModelTypeMap
