// This file was automatically generated, DO NOT EDIT IT MANUALLY!

import { OptionalProps } from "tuff-core/types"

export type Contact = {
    id: string
    created_at: string
    updated_at: string
    _state: number
    created_by_id?: string
    created_by_name: string
    extern_id?: string
    updated_by_id?: string
    updated_by_name?: string
    location_id: string
    user_id: string
    contact_type: "customer" | "employee"

    created_by?: User

    updated_by?: User

    user?: User

    location?: Location
}

export type UnpersistedContact = {
    id?: string

    created_at?: string

    updated_at?: string

    _state?: number

    created_by_id?: string

    created_by_name?: string

    extern_id?: string

    updated_by_id?: string

    updated_by_name?: string

    location_id: string

    user_id: string

    contact_type: "customer" | "employee"

    created_by?: User

    updated_by?: User

    user?: User

    location?: Location
}

export const ContactEnumFields = {
    contact_type: ["customer", "employee"] as const,
}

export type Invoice = {
    id: string
    created_at: string
    updated_at: string
    _state: number
    created_by_id?: string
    created_by_name: string
    extern_id?: string
    updated_by_id?: string
    updated_by_name?: string
    date: string
    status: "pending" | "open" | "paid" | "void"
    price: number
    location_id: string
    lines?: string[]

    created_by?: User

    updated_by?: User

    location?: Location

    work_orders?: WorkOrder[]
}

export type UnpersistedInvoice = {
    id?: string

    created_at?: string

    updated_at?: string

    _state?: number

    created_by_id?: string

    created_by_name?: string

    extern_id?: string

    updated_by_id?: string

    updated_by_name?: string

    date: string

    status: "pending" | "open" | "paid" | "void"

    price: number

    location_id: string

    lines?: string[]

    created_by?: User

    updated_by?: User

    location?: Location

    work_orders?: OptionalProps<UnpersistedWorkOrder, "invoice_id">[]
}

export const InvoiceEnumFields = {
    status: ["pending", "open", "paid", "void"] as const,
}

export type Location = {
    id: string
    created_at: string
    updated_at: string
    _state: number
    created_by_id?: string
    created_by_name: string
    extern_id?: string
    updated_by_id?: string
    updated_by_name?: string
    annual_value?: number
    city?: string
    state?: string
    display_name: string
    number: number
    tags?: string[]
    status: "onetime" | "contract"
    data?: object
    address1?: string
    address2?: string
    zip?: string
    county?: string

    created_by?: User

    updated_by?: User

    work_orders?: WorkOrder[]

    invoices?: Invoice[]

    contacts?: Contact[]
}

export type UnpersistedLocation = {
    id?: string

    created_at?: string

    updated_at?: string

    _state?: number

    created_by_id?: string

    created_by_name?: string

    extern_id?: string

    updated_by_id?: string

    updated_by_name?: string

    annual_value?: number

    city?: string

    state?: string

    display_name: string

    number: number

    tags?: string[]

    status: "onetime" | "contract"

    data?: object

    address1?: string

    address2?: string

    zip?: string

    county?: string

    created_by?: User

    updated_by?: User

    work_orders?: OptionalProps<UnpersistedWorkOrder, "location_id">[]

    invoices?: OptionalProps<UnpersistedInvoice, "location_id">[]

    contacts?: OptionalProps<UnpersistedContact, "location_id">[]
}

export const LocationEnumFields = {
    status: ["onetime", "contract"] as const,
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

export type Target = {
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
    description?: string

    created_by?: User

    updated_by?: User

    work_orders?: WorkOrder[]
}

export type UnpersistedTarget = {
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

    description?: string

    created_by?: User

    updated_by?: User

    work_orders?: OptionalProps<UnpersistedWorkOrder, "target_id">[]
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

    work_orders?: WorkOrder[]

    contacts?: Contact[]
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

    work_orders?: OptionalProps<UnpersistedWorkOrder, "user_id">[]

    contacts?: OptionalProps<UnpersistedContact, "user_id">[]
}

export const UserEnumFields = {
    role: ["technician", "office", "customer"] as const,
}

export type WorkOrder = {
    id: string
    created_at: string
    updated_at: string
    _state: number
    created_by_id?: string
    created_by_name: string
    extern_id?: string
    updated_by_id?: string
    updated_by_name?: string
    time?: string
    status: "active" | "complete" | "cancelled"
    price: number
    location_id: string
    user_id: string
    invoice_id?: string
    target_id?: string
    notes?: string

    created_by?: User

    updated_by?: User

    target?: Target

    invoice?: Invoice

    location?: Location

    user?: User
}

export type UnpersistedWorkOrder = {
    id?: string

    created_at?: string

    updated_at?: string

    _state?: number

    created_by_id?: string

    created_by_name?: string

    extern_id?: string

    updated_by_id?: string

    updated_by_name?: string

    time?: string

    status: "active" | "complete" | "cancelled"

    price: number

    location_id: string

    user_id: string

    invoice_id?: string

    target_id?: string

    notes?: string

    created_by?: User

    updated_by?: User

    target?: Target

    invoice?: Invoice

    location?: Location

    user?: User
}

export const WorkOrderEnumFields = {
    status: ["active", "complete", "cancelled"] as const,
}

/**
 * Map model names to their types.
 */
export type ModelTypeMap = {
    contact: Contact

    invoice: Invoice

    location: Location

    script: Script

    script_run: ScriptRun

    target: Target

    user: User

    work_order: WorkOrder
}

/**
 * Map model names to their unpersisted types.
 */
export type UnpersistedModelTypeMap = {
    contact: UnpersistedContact

    invoice: UnpersistedInvoice

    location: UnpersistedLocation

    script: UnpersistedScript

    script_run: UnpersistedScriptRun

    target: UnpersistedTarget

    user: UnpersistedUser

    work_order: UnpersistedWorkOrder
}

/**
 * Map model names to their association names.
 */
export type ModelIncludesMap = {
    contact: "created_by" | "location" | "updated_by" | "user"

    invoice: "created_by" | "location" | "updated_by" | "work_orders"

    location: "contacts" | "created_by" | "invoices" | "updated_by" | "work_orders"

    script: "created_by" | "script_runs" | "updated_by"

    script_run: "created_by" | "script" | "updated_by"

    target: "created_by" | "updated_by" | "work_orders"

    user: "contacts" | "created_by" | "updated_by" | "work_orders"

    work_order: "created_by" | "invoice" | "location" | "target" | "updated_by" | "user"
}

/**
 * Map "sluggable" model names to their types
 */
export type SluggableModelTypeMap = {}

/**
 * A type consisting of all possible model names.
 */
export type ModelName = keyof ModelTypeMap
