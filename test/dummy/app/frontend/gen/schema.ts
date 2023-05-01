// This file was automatically generated, DO NOT EDIT IT MANUALLY!

/**
 * Definition for a single column in the schema.
 */
export type ColumnDef = {
    name: string
    nullable: boolean
    array: boolean
    type: string
    possible_values?: string[]
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
    table_name: String
    columns: Record<string, ColumnDef>
    belongs_to: Record<string, BelongsToDef>
    has_many: Record<string, HasManyDef>
}

/**
 * All models in the schema.
 */
const models: Record<string, ModelDef> = {
    Contact: {
        table_name: "contacts",
        columns: {
            id: {
                name: "id",
                nullable: false,
                array: false,
                type: "uuid",
            },

            created_at: {
                name: "created_at",
                nullable: false,
                array: false,
                type: "datetime",
            },

            updated_at: {
                name: "updated_at",
                nullable: false,
                array: false,
                type: "datetime",
            },

            _state: {
                name: "_state",
                nullable: false,
                array: false,
                type: "integer",
            },

            created_by_id: {
                name: "created_by_id",
                nullable: true,
                array: false,
                type: "uuid",
            },

            created_by_name: {
                name: "created_by_name",
                nullable: false,
                array: false,
                type: "text",
            },

            extern_id: {
                name: "extern_id",
                nullable: true,
                array: false,
                type: "text",
            },

            updated_by_id: {
                name: "updated_by_id",
                nullable: true,
                array: false,
                type: "uuid",
            },

            updated_by_name: {
                name: "updated_by_name",
                nullable: true,
                array: false,
                type: "text",
            },

            location_id: {
                name: "location_id",
                nullable: false,
                array: false,
                type: "uuid",
            },

            user_id: {
                name: "user_id",
                nullable: false,
                array: false,
                type: "uuid",
            },

            contact_type: {
                name: "contact_type",
                nullable: false,
                array: false,
                type: "enum",

                possible_values: ["customer", "employee"],
            },
        },
        belongs_to: {
            created_by: {
                name: "created_by",
                model: "User",
                optional: true,
            },

            updated_by: {
                name: "updated_by",
                model: "User",
                optional: true,
            },

            user: {
                name: "user",
                model: "User",
                optional: false,
            },

            location: {
                name: "location",
                model: "Location",
                optional: false,
            },
        },
        has_many: {},
    },

    Invoice: {
        table_name: "invoices",
        columns: {
            id: {
                name: "id",
                nullable: false,
                array: false,
                type: "uuid",
            },

            created_at: {
                name: "created_at",
                nullable: false,
                array: false,
                type: "datetime",
            },

            updated_at: {
                name: "updated_at",
                nullable: false,
                array: false,
                type: "datetime",
            },

            _state: {
                name: "_state",
                nullable: false,
                array: false,
                type: "integer",
            },

            created_by_id: {
                name: "created_by_id",
                nullable: true,
                array: false,
                type: "uuid",
            },

            created_by_name: {
                name: "created_by_name",
                nullable: false,
                array: false,
                type: "text",
            },

            extern_id: {
                name: "extern_id",
                nullable: true,
                array: false,
                type: "text",
            },

            updated_by_id: {
                name: "updated_by_id",
                nullable: true,
                array: false,
                type: "uuid",
            },

            updated_by_name: {
                name: "updated_by_name",
                nullable: true,
                array: false,
                type: "text",
            },

            date: {
                name: "date",
                nullable: false,
                array: false,
                type: "date",
            },

            status: {
                name: "status",
                nullable: false,
                array: false,
                type: "enum",

                possible_values: ["pending", "open", "paid", "void"],
            },

            price: {
                name: "price",
                nullable: false,
                array: false,
                type: "integer",
            },

            location_id: {
                name: "location_id",
                nullable: false,
                array: false,
                type: "uuid",
            },

            lines: {
                name: "lines",
                nullable: true,
                array: true,
                type: "text",
            },
        },
        belongs_to: {
            created_by: {
                name: "created_by",
                model: "User",
                optional: true,
            },

            updated_by: {
                name: "updated_by",
                model: "User",
                optional: true,
            },

            location: {
                name: "location",
                model: "Location",
                optional: false,
            },
        },
        has_many: {
            work_orders: {
                name: "work_orders",
                model: "WorkOrder",
            },
        },
    },

    Location: {
        table_name: "locations",
        columns: {
            id: {
                name: "id",
                nullable: false,
                array: false,
                type: "uuid",
            },

            created_at: {
                name: "created_at",
                nullable: false,
                array: false,
                type: "datetime",
            },

            updated_at: {
                name: "updated_at",
                nullable: false,
                array: false,
                type: "datetime",
            },

            _state: {
                name: "_state",
                nullable: false,
                array: false,
                type: "integer",
            },

            created_by_id: {
                name: "created_by_id",
                nullable: true,
                array: false,
                type: "uuid",
            },

            created_by_name: {
                name: "created_by_name",
                nullable: false,
                array: false,
                type: "text",
            },

            extern_id: {
                name: "extern_id",
                nullable: true,
                array: false,
                type: "text",
            },

            updated_by_id: {
                name: "updated_by_id",
                nullable: true,
                array: false,
                type: "uuid",
            },

            updated_by_name: {
                name: "updated_by_name",
                nullable: true,
                array: false,
                type: "text",
            },

            annual_value: {
                name: "annual_value",
                nullable: true,
                array: false,
                type: "integer",
            },

            city: {
                name: "city",
                nullable: true,
                array: false,
                type: "text",
            },

            state: {
                name: "state",
                nullable: true,
                array: false,
                type: "text",
            },

            display_name: {
                name: "display_name",
                nullable: false,
                array: false,
                type: "text",
            },

            number: {
                name: "number",
                nullable: false,
                array: false,
                type: "integer",
            },

            tags: {
                name: "tags",
                nullable: true,
                array: true,
                type: "text",
            },

            status: {
                name: "status",
                nullable: false,
                array: false,
                type: "enum",

                possible_values: ["onetime", "contract"],
            },

            data: {
                name: "data",
                nullable: true,
                array: false,
                type: "json",
            },

            address1: {
                name: "address1",
                nullable: true,
                array: false,
                type: "text",
            },

            address2: {
                name: "address2",
                nullable: true,
                array: false,
                type: "text",
            },

            zip: {
                name: "zip",
                nullable: true,
                array: false,
                type: "text",
            },

            county: {
                name: "county",
                nullable: true,
                array: false,
                type: "text",
            },
        },
        belongs_to: {
            created_by: {
                name: "created_by",
                model: "User",
                optional: true,
            },

            updated_by: {
                name: "updated_by",
                model: "User",
                optional: true,
            },
        },
        has_many: {
            work_orders: {
                name: "work_orders",
                model: "WorkOrder",
            },

            invoices: {
                name: "invoices",
                model: "Invoice",
            },

            contacts: {
                name: "contacts",
                model: "Contact",
            },
        },
    },

    Script: {
        table_name: "scripts",
        columns: {
            id: {
                name: "id",
                nullable: false,
                array: false,
                type: "uuid",
            },

            created_at: {
                name: "created_at",
                nullable: false,
                array: false,
                type: "datetime",
            },

            updated_at: {
                name: "updated_at",
                nullable: false,
                array: false,
                type: "datetime",
            },

            _state: {
                name: "_state",
                nullable: false,
                array: false,
                type: "integer",
            },

            created_by_id: {
                name: "created_by_id",
                nullable: true,
                array: false,
                type: "uuid",
            },

            created_by_name: {
                name: "created_by_name",
                nullable: false,
                array: false,
                type: "text",
            },

            extern_id: {
                name: "extern_id",
                nullable: true,
                array: false,
                type: "text",
            },

            updated_by_id: {
                name: "updated_by_id",
                nullable: true,
                array: false,
                type: "uuid",
            },

            updated_by_name: {
                name: "updated_by_name",
                nullable: true,
                array: false,
                type: "text",
            },

            body: {
                name: "body",
                nullable: true,
                array: false,
                type: "text",
            },

            title: {
                name: "title",
                nullable: false,
                array: false,
                type: "text",
            },

            description: {
                name: "description",
                nullable: true,
                array: false,
                type: "text",
            },

            email_recipients: {
                name: "email_recipients",
                nullable: true,
                array: true,
                type: "text",
            },

            script_fields: {
                name: "script_fields",
                nullable: true,
                array: false,
                type: "json",
            },

            report_category: {
                name: "report_category",
                nullable: true,
                array: false,
                type: "enum",

                possible_values: ["admin", "locations", "miscellaneous", "none"],
            },

            schedule_rules: {
                name: "schedule_rules",
                nullable: true,
                array: false,
                type: "json",
            },

            schedule_rule_summaries: {
                name: "schedule_rule_summaries",
                nullable: true,
                array: true,
                type: "text",
            },

            schedule_time: {
                name: "schedule_time",
                nullable: false,
                array: false,
                type: "enum",

                possible_values: ["none", "evening", "morning", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18"],
            },

            num_per_year: {
                name: "num_per_year",
                nullable: false,
                array: false,
                type: "integer",
            },

            schedule_type: {
                name: "schedule_type",
                nullable: false,
                array: false,
                type: "text",
            },

            order_grouping: {
                name: "order_grouping",
                nullable: false,
                array: false,
                type: "enum",

                possible_values: ["combine", "separate"],
            },

            visibility: {
                name: "visibility",
                nullable: false,
                array: false,
                type: "enum",

                possible_values: ["public", "private"],
            },

            org_id: {
                name: "org_id",
                nullable: true,
                array: false,
                type: "text",
            },
        },
        belongs_to: {
            created_by: {
                name: "created_by",
                model: "User",
                optional: true,
            },

            updated_by: {
                name: "updated_by",
                model: "User",
                optional: true,
            },
        },
        has_many: {
            script_runs: {
                name: "script_runs",
                model: "ScriptRun",
            },
        },
    },

    ScriptRun: {
        table_name: "script_runs",
        columns: {
            id: {
                name: "id",
                nullable: false,
                array: false,
                type: "uuid",
            },

            created_at: {
                name: "created_at",
                nullable: false,
                array: false,
                type: "datetime",
            },

            updated_at: {
                name: "updated_at",
                nullable: false,
                array: false,
                type: "datetime",
            },

            _state: {
                name: "_state",
                nullable: false,
                array: false,
                type: "integer",
            },

            created_by_id: {
                name: "created_by_id",
                nullable: true,
                array: false,
                type: "uuid",
            },

            created_by_name: {
                name: "created_by_name",
                nullable: false,
                array: false,
                type: "text",
            },

            extern_id: {
                name: "extern_id",
                nullable: true,
                array: false,
                type: "text",
            },

            updated_by_id: {
                name: "updated_by_id",
                nullable: true,
                array: false,
                type: "uuid",
            },

            updated_by_name: {
                name: "updated_by_name",
                nullable: true,
                array: false,
                type: "text",
            },

            duration: {
                name: "duration",
                nullable: true,
                array: false,
                type: "float",
            },

            exception: {
                name: "exception",
                nullable: true,
                array: false,
                type: "text",
            },

            backtrace: {
                name: "backtrace",
                nullable: true,
                array: true,
                type: "text",
            },

            fields: {
                name: "fields",
                nullable: true,
                array: false,
                type: "json",
            },

            log_file_name: {
                name: "log_file_name",
                nullable: true,
                array: false,
                type: "string",
            },

            log_content_type: {
                name: "log_content_type",
                nullable: true,
                array: false,
                type: "string",
            },

            log_file_size: {
                name: "log_file_size",
                nullable: true,
                array: false,
                type: "integer",
            },

            log_updated_at: {
                name: "log_updated_at",
                nullable: true,
                array: false,
                type: "datetime",
            },

            status: {
                name: "status",
                nullable: false,
                array: false,
                type: "enum",

                possible_values: ["running", "success", "error", "cancelled", "cleared"],
            },

            script_id: {
                name: "script_id",
                nullable: false,
                array: false,
                type: "uuid",
            },

            org_id: {
                name: "org_id",
                nullable: true,
                array: false,
                type: "text",
            },

            script_body: {
                name: "script_body",
                nullable: true,
                array: false,
                type: "text",
            },
        },
        belongs_to: {
            created_by: {
                name: "created_by",
                model: "User",
                optional: true,
            },

            updated_by: {
                name: "updated_by",
                model: "User",
                optional: true,
            },

            script: {
                name: "script",
                model: "Script",
                optional: false,
            },
        },
        has_many: {},
    },

    Target: {
        table_name: "targets",
        columns: {
            id: {
                name: "id",
                nullable: false,
                array: false,
                type: "uuid",
            },

            created_at: {
                name: "created_at",
                nullable: false,
                array: false,
                type: "datetime",
            },

            updated_at: {
                name: "updated_at",
                nullable: false,
                array: false,
                type: "datetime",
            },

            _state: {
                name: "_state",
                nullable: false,
                array: false,
                type: "integer",
            },

            created_by_id: {
                name: "created_by_id",
                nullable: true,
                array: false,
                type: "uuid",
            },

            created_by_name: {
                name: "created_by_name",
                nullable: false,
                array: false,
                type: "text",
            },

            extern_id: {
                name: "extern_id",
                nullable: true,
                array: false,
                type: "text",
            },

            updated_by_id: {
                name: "updated_by_id",
                nullable: true,
                array: false,
                type: "uuid",
            },

            updated_by_name: {
                name: "updated_by_name",
                nullable: true,
                array: false,
                type: "text",
            },

            name: {
                name: "name",
                nullable: false,
                array: false,
                type: "text",
            },

            description: {
                name: "description",
                nullable: true,
                array: false,
                type: "text",
            },
        },
        belongs_to: {
            created_by: {
                name: "created_by",
                model: "User",
                optional: true,
            },

            updated_by: {
                name: "updated_by",
                model: "User",
                optional: true,
            },
        },
        has_many: {
            work_orders: {
                name: "work_orders",
                model: "WorkOrder",
            },
        },
    },

    User: {
        table_name: "users",
        columns: {
            id: {
                name: "id",
                nullable: false,
                array: false,
                type: "uuid",
            },

            created_at: {
                name: "created_at",
                nullable: false,
                array: false,
                type: "datetime",
            },

            updated_at: {
                name: "updated_at",
                nullable: false,
                array: false,
                type: "datetime",
            },

            _state: {
                name: "_state",
                nullable: false,
                array: false,
                type: "integer",
            },

            created_by_id: {
                name: "created_by_id",
                nullable: true,
                array: false,
                type: "uuid",
            },

            created_by_name: {
                name: "created_by_name",
                nullable: false,
                array: false,
                type: "text",
            },

            extern_id: {
                name: "extern_id",
                nullable: true,
                array: false,
                type: "text",
            },

            updated_by_id: {
                name: "updated_by_id",
                nullable: true,
                array: false,
                type: "uuid",
            },

            updated_by_name: {
                name: "updated_by_name",
                nullable: true,
                array: false,
                type: "text",
            },

            address1: {
                name: "address1",
                nullable: true,
                array: false,
                type: "text",
            },

            address2: {
                name: "address2",
                nullable: true,
                array: false,
                type: "text",
            },

            city: {
                name: "city",
                nullable: true,
                array: false,
                type: "text",
            },

            county: {
                name: "county",
                nullable: true,
                array: false,
                type: "text",
            },

            email: {
                name: "email",
                nullable: true,
                array: false,
                type: "text",
            },

            first_name: {
                name: "first_name",
                nullable: false,
                array: false,
                type: "text",
            },

            last_logged_in_at: {
                name: "last_logged_in_at",
                nullable: true,
                array: false,
                type: "time",
            },

            last_name: {
                name: "last_name",
                nullable: false,
                array: false,
                type: "text",
            },

            notes_html: {
                name: "notes_html",
                nullable: true,
                array: false,
                type: "text",
            },

            notes_raw: {
                name: "notes_raw",
                nullable: true,
                array: false,
                type: "text",
            },

            password_digest: {
                name: "password_digest",
                nullable: false,
                array: false,
                type: "text",
            },

            password_reset_token: {
                name: "password_reset_token",
                nullable: true,
                array: false,
                type: "text",
            },

            password_reset_token_expires_at: {
                name: "password_reset_token_expires_at",
                nullable: true,
                array: false,
                type: "datetime",
            },

            role: {
                name: "role",
                nullable: false,
                array: false,
                type: "enum",

                possible_values: ["technician", "office", "customer"],
            },

            state: {
                name: "state",
                nullable: true,
                array: false,
                type: "text",
            },

            tags: {
                name: "tags",
                nullable: false,
                array: true,
                type: "text",
            },

            zip: {
                name: "zip",
                nullable: true,
                array: false,
                type: "text",
            },
        },
        belongs_to: {
            created_by: {
                name: "created_by",
                model: "User",
                optional: true,
            },

            updated_by: {
                name: "updated_by",
                model: "User",
                optional: true,
            },
        },
        has_many: {
            work_orders: {
                name: "work_orders",
                model: "WorkOrder",
            },

            contacts: {
                name: "contacts",
                model: "Contact",
            },
        },
    },

    WorkOrder: {
        table_name: "work_orders",
        columns: {
            id: {
                name: "id",
                nullable: false,
                array: false,
                type: "uuid",
            },

            created_at: {
                name: "created_at",
                nullable: false,
                array: false,
                type: "datetime",
            },

            updated_at: {
                name: "updated_at",
                nullable: false,
                array: false,
                type: "datetime",
            },

            _state: {
                name: "_state",
                nullable: false,
                array: false,
                type: "integer",
            },

            created_by_id: {
                name: "created_by_id",
                nullable: true,
                array: false,
                type: "uuid",
            },

            created_by_name: {
                name: "created_by_name",
                nullable: false,
                array: false,
                type: "text",
            },

            extern_id: {
                name: "extern_id",
                nullable: true,
                array: false,
                type: "text",
            },

            updated_by_id: {
                name: "updated_by_id",
                nullable: true,
                array: false,
                type: "uuid",
            },

            updated_by_name: {
                name: "updated_by_name",
                nullable: true,
                array: false,
                type: "text",
            },

            time: {
                name: "time",
                nullable: true,
                array: false,
                type: "datetime",
            },

            status: {
                name: "status",
                nullable: false,
                array: false,
                type: "enum",

                possible_values: ["active", "complete", "cancelled"],
            },

            price: {
                name: "price",
                nullable: false,
                array: false,
                type: "integer",
            },

            location_id: {
                name: "location_id",
                nullable: false,
                array: false,
                type: "uuid",
            },

            user_id: {
                name: "user_id",
                nullable: false,
                array: false,
                type: "uuid",
            },

            invoice_id: {
                name: "invoice_id",
                nullable: true,
                array: false,
                type: "uuid",
            },

            target_id: {
                name: "target_id",
                nullable: true,
                array: false,
                type: "uuid",
            },

            notes: {
                name: "notes",
                nullable: true,
                array: false,
                type: "text",
            },
        },
        belongs_to: {
            created_by: {
                name: "created_by",
                model: "User",
                optional: true,
            },

            updated_by: {
                name: "updated_by",
                model: "User",
                optional: true,
            },

            target: {
                name: "target",
                model: "Target",
                optional: true,
            },

            invoice: {
                name: "invoice",
                model: "Invoice",
                optional: true,
            },

            location: {
                name: "location",
                model: "Location",
                optional: false,
            },

            user: {
                name: "user",
                model: "User",
                optional: false,
            },
        },
        has_many: {},
    },
}

const Schema = {
    models,
}

export default Schema
