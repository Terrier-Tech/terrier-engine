# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2024_07_17_132834) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pgcrypto"
  enable_extension "plpgsql"

  create_table "contacts", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "_state", default: 0, null: false
    t.uuid "created_by_id"
    t.text "created_by_name", null: false
    t.text "extern_id"
    t.uuid "updated_by_id"
    t.text "updated_by_name"
    t.uuid "location_id", null: false
    t.uuid "user_id", null: false
    t.text "contact_type", null: false
    t.index ["_state"], name: "index_contacts_on__state"
    t.index ["created_by_id"], name: "index_contacts_on_created_by_id"
    t.index ["extern_id"], name: "index_contacts_on_extern_id"
    t.index ["location_id"], name: "index_contacts_on_location_id"
    t.index ["updated_by_id"], name: "index_contacts_on_updated_by_id"
    t.index ["user_id"], name: "index_contacts_on_user_id"
  end

  create_table "dd_dive_groups", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "_state", default: 0, null: false
    t.uuid "created_by_id"
    t.text "created_by_name", null: false
    t.text "extern_id"
    t.uuid "updated_by_id"
    t.text "updated_by_name"
    t.text "name", null: false
    t.text "icon"
    t.text "description_raw"
    t.text "description_html"
    t.integer "sort_order"
    t.text "group_types", default: [], null: false, array: true
    t.index ["_state"], name: "index_dd_dive_groups_on__state"
    t.index ["created_by_id"], name: "index_dd_dive_groups_on_created_by_id"
    t.index ["extern_id"], name: "index_dd_dive_groups_on_extern_id"
    t.index ["updated_by_id"], name: "index_dd_dive_groups_on_updated_by_id"
  end

  create_table "dd_dive_plots", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "_state", default: 0, null: false
    t.uuid "created_by_id"
    t.text "created_by_name", null: false
    t.text "extern_id"
    t.uuid "updated_by_id"
    t.text "updated_by_name"
    t.text "title", null: false
    t.jsonb "traces", default: [], null: false
    t.jsonb "layout", default: {}, null: false
    t.uuid "dd_dive_id", null: false
    t.index ["_state"], name: "index_dd_dive_plots_on__state"
    t.index ["created_by_id"], name: "index_dd_dive_plots_on_created_by_id"
    t.index ["dd_dive_id"], name: "index_dd_dive_plots_on_dd_dive_id"
    t.index ["extern_id"], name: "index_dd_dive_plots_on_extern_id"
    t.index ["updated_by_id"], name: "index_dd_dive_plots_on_updated_by_id"
  end

  create_table "dd_dive_runs", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "_state", default: 0, null: false
    t.uuid "created_by_id"
    t.text "created_by_name", null: false
    t.text "extern_id"
    t.uuid "updated_by_id"
    t.text "updated_by_name"
    t.uuid "dd_dive_id"
    t.jsonb "input_data"
    t.jsonb "output_data"
    t.jsonb "output_file_data"
    t.text "status", null: false
    t.text "delivery_recipients", array: true
    t.jsonb "delivery_data"
    t.index ["_state"], name: "index_dd_dive_runs_on__state"
    t.index ["created_by_id"], name: "index_dd_dive_runs_on_created_by_id"
    t.index ["dd_dive_id"], name: "index_dd_dive_runs_on_dd_dive_id"
    t.index ["delivery_recipients"], name: "index_dd_dive_runs_on_delivery_recipients", using: :gin
    t.index ["extern_id"], name: "index_dd_dive_runs_on_extern_id"
    t.index ["updated_by_id"], name: "index_dd_dive_runs_on_updated_by_id"
  end

  create_table "dd_dives", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "_state", default: 0, null: false
    t.uuid "created_by_id"
    t.text "created_by_name", null: false
    t.text "extern_id"
    t.uuid "updated_by_id"
    t.text "updated_by_name"
    t.uuid "owner_id"
    t.uuid "dd_dive_group_id"
    t.text "name", null: false
    t.text "description_raw"
    t.text "description_html"
    t.text "visibility", null: false
    t.integer "sort_order"
    t.jsonb "query_data"
    t.text "dive_types", default: [], null: false, array: true
    t.text "delivery_mode"
    t.text "delivery_recipients", array: true
    t.jsonb "delivery_schedule"
    t.index ["_state"], name: "index_dd_dives_on__state"
    t.index ["created_by_id"], name: "index_dd_dives_on_created_by_id"
    t.index ["dd_dive_group_id"], name: "index_dd_dives_on_dd_dive_group_id"
    t.index ["extern_id"], name: "index_dd_dives_on_extern_id"
    t.index ["owner_id"], name: "dd_dive_owners"
    t.index ["updated_by_id"], name: "index_dd_dives_on_updated_by_id"
  end

  create_table "invoices", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "_state", default: 0, null: false
    t.uuid "created_by_id"
    t.text "created_by_name", null: false
    t.text "extern_id"
    t.uuid "updated_by_id"
    t.text "updated_by_name"
    t.date "date", null: false
    t.text "status", null: false
    t.integer "price", default: 0, null: false
    t.uuid "location_id", null: false
    t.text "lines", array: true
    t.index ["_state"], name: "index_invoices_on__state"
    t.index ["created_by_id"], name: "index_invoices_on_created_by_id"
    t.index ["extern_id"], name: "index_invoices_on_extern_id"
    t.index ["location_id"], name: "index_invoices_on_location_id"
    t.index ["updated_by_id"], name: "index_invoices_on_updated_by_id"
  end

  create_table "locations", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.integer "_state", default: 0, null: false
    t.uuid "created_by_id"
    t.text "created_by_name", null: false
    t.text "extern_id"
    t.uuid "updated_by_id"
    t.text "updated_by_name"
    t.integer "annual_value"
    t.text "city"
    t.text "state"
    t.text "display_name", null: false
    t.integer "number", null: false
    t.text "tags", array: true
    t.text "status", null: false
    t.json "data"
    t.text "address1"
    t.text "address2"
    t.text "zip"
    t.text "county"
    t.index ["_state"], name: "index_locations_on__state"
    t.index ["created_by_id"], name: "index_locations_on_created_by_id"
    t.index ["extern_id"], name: "index_locations_on_extern_id"
    t.index ["number"], name: "index_locations_on_number"
    t.index ["status"], name: "index_locations_on_status"
    t.index ["tags"], name: "index_locations_on_tags"
    t.index ["updated_by_id"], name: "index_locations_on_updated_by_id"
  end

  create_table "script_runs", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.integer "_state", default: 0, null: false
    t.uuid "created_by_id"
    t.text "created_by_name", null: false
    t.text "extern_id"
    t.uuid "updated_by_id"
    t.text "updated_by_name"
    t.float "duration"
    t.text "exception"
    t.text "backtrace", array: true
    t.json "fields"
    t.string "log_file_name"
    t.string "log_content_type"
    t.bigint "log_file_size"
    t.datetime "log_updated_at", precision: nil
    t.string "status", default: "success", null: false
    t.uuid "script_id", null: false
    t.text "org_id"
    t.text "script_body"
    t.index ["_state"], name: "index_script_runs_on__state"
    t.index ["created_by_id"], name: "index_script_runs_on_created_by_id"
    t.index ["extern_id"], name: "index_script_runs_on_extern_id"
    t.index ["script_id"], name: "index_script_runs_on_script_id"
    t.index ["updated_by_id"], name: "index_script_runs_on_updated_by_id"
  end

  create_table "scripts", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.integer "_state", default: 0, null: false
    t.uuid "created_by_id"
    t.text "created_by_name", null: false
    t.text "extern_id"
    t.uuid "updated_by_id"
    t.text "updated_by_name"
    t.text "body"
    t.text "title", null: false
    t.text "description"
    t.text "email_recipients", array: true
    t.json "script_fields"
    t.text "report_category"
    t.json "schedule_rules"
    t.text "schedule_rule_summaries", array: true
    t.text "schedule_time", default: "none", null: false
    t.integer "num_per_year", default: 0, null: false
    t.text "schedule_type", default: "every", null: false
    t.text "order_grouping", default: "combine", null: false
    t.text "visibility", default: "private", null: false
    t.text "org_id"
    t.index ["_state"], name: "index_scripts_on__state"
    t.index ["created_by_id"], name: "index_scripts_on_created_by_id"
    t.index ["extern_id"], name: "index_scripts_on_extern_id"
    t.index ["updated_by_id"], name: "index_scripts_on_updated_by_id"
  end

  create_table "targets", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "_state", default: 0, null: false
    t.uuid "created_by_id"
    t.text "created_by_name", null: false
    t.text "extern_id"
    t.uuid "updated_by_id"
    t.text "updated_by_name"
    t.text "name", null: false
    t.text "description"
    t.index ["_state"], name: "index_targets_on__state"
    t.index ["created_by_id"], name: "index_targets_on_created_by_id"
    t.index ["extern_id"], name: "index_targets_on_extern_id"
    t.index ["name"], name: "index_targets_on_name", unique: true
    t.index ["updated_by_id"], name: "index_targets_on_updated_by_id"
  end

  create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.integer "_state", default: 0, null: false
    t.uuid "created_by_id"
    t.text "created_by_name", null: false
    t.text "extern_id"
    t.uuid "updated_by_id"
    t.text "updated_by_name"
    t.text "address1"
    t.text "address2"
    t.text "city"
    t.text "county"
    t.text "email"
    t.text "first_name", null: false
    t.time "last_logged_in_at"
    t.text "last_name", null: false
    t.text "notes_html"
    t.text "notes_raw"
    t.text "password_digest", null: false
    t.text "password_reset_token"
    t.datetime "password_reset_token_expires_at", precision: nil
    t.text "role", null: false
    t.text "state"
    t.text "tags", default: [], null: false, array: true
    t.text "zip"
    t.index ["_state"], name: "index_users_on__state"
    t.index ["created_by_id"], name: "index_users_on_created_by_id"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["extern_id"], name: "index_users_on_extern_id"
    t.index ["role"], name: "index_users_on_role"
    t.index ["tags"], name: "index_users_on_tags"
    t.index ["updated_by_id"], name: "index_users_on_updated_by_id"
  end

  create_table "work_orders", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "_state", default: 0, null: false
    t.uuid "created_by_id"
    t.text "created_by_name", null: false
    t.text "extern_id"
    t.uuid "updated_by_id"
    t.text "updated_by_name"
    t.datetime "time", precision: nil
    t.text "status", null: false
    t.integer "price", default: 0, null: false
    t.uuid "location_id", null: false
    t.uuid "user_id", null: false
    t.uuid "invoice_id"
    t.uuid "target_id"
    t.text "notes"
    t.index ["_state"], name: "index_work_orders_on__state"
    t.index ["created_by_id"], name: "index_work_orders_on_created_by_id"
    t.index ["extern_id"], name: "index_work_orders_on_extern_id"
    t.index ["invoice_id"], name: "index_work_orders_on_invoice_id"
    t.index ["location_id"], name: "index_work_orders_on_location_id"
    t.index ["target_id"], name: "index_work_orders_on_target_id"
    t.index ["updated_by_id"], name: "index_work_orders_on_updated_by_id"
    t.index ["user_id"], name: "index_work_orders_on_user_id"
  end

  add_foreign_key "contacts", "locations"
  add_foreign_key "contacts", "users"
  add_foreign_key "contacts", "users", column: "created_by_id"
  add_foreign_key "contacts", "users", column: "updated_by_id"
  add_foreign_key "dd_dive_groups", "users", column: "created_by_id"
  add_foreign_key "dd_dive_groups", "users", column: "updated_by_id"
  add_foreign_key "dd_dive_plots", "dd_dives"
  add_foreign_key "dd_dive_plots", "users", column: "created_by_id"
  add_foreign_key "dd_dive_plots", "users", column: "updated_by_id"
  add_foreign_key "dd_dive_runs", "dd_dives"
  add_foreign_key "dd_dive_runs", "users", column: "created_by_id"
  add_foreign_key "dd_dive_runs", "users", column: "updated_by_id"
  add_foreign_key "dd_dives", "dd_dive_groups"
  add_foreign_key "dd_dives", "users", column: "created_by_id"
  add_foreign_key "dd_dives", "users", column: "owner_id"
  add_foreign_key "dd_dives", "users", column: "updated_by_id"
  add_foreign_key "invoices", "locations"
  add_foreign_key "invoices", "users", column: "created_by_id"
  add_foreign_key "invoices", "users", column: "updated_by_id"
  add_foreign_key "locations", "users", column: "created_by_id"
  add_foreign_key "locations", "users", column: "updated_by_id"
  add_foreign_key "script_runs", "scripts"
  add_foreign_key "script_runs", "users", column: "created_by_id"
  add_foreign_key "script_runs", "users", column: "updated_by_id"
  add_foreign_key "scripts", "users", column: "created_by_id"
  add_foreign_key "scripts", "users", column: "updated_by_id"
  add_foreign_key "targets", "users", column: "created_by_id"
  add_foreign_key "targets", "users", column: "updated_by_id"
  add_foreign_key "users", "users", column: "created_by_id"
  add_foreign_key "users", "users", column: "updated_by_id"
  add_foreign_key "work_orders", "invoices"
  add_foreign_key "work_orders", "locations"
  add_foreign_key "work_orders", "targets"
  add_foreign_key "work_orders", "users"
  add_foreign_key "work_orders", "users", column: "created_by_id"
  add_foreign_key "work_orders", "users", column: "updated_by_id"
end
