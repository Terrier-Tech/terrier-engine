# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2018_12_25_172428) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "pgcrypto"
  enable_extension "plpgsql"

  create_table "locations", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
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
    t.index ["_state"], name: "index_locations_on__state"
    t.index ["created_by_id"], name: "index_locations_on_created_by_id"
    t.index ["extern_id"], name: "index_locations_on_extern_id"
    t.index ["number"], name: "index_locations_on_number"
    t.index ["status"], name: "index_locations_on_status"
    t.index ["tags"], name: "index_locations_on_tags"
    t.index ["updated_by_id"], name: "index_locations_on_updated_by_id"
  end

  create_table "script_inputs", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "_state", default: 0, null: false
    t.uuid "created_by_id"
    t.text "created_by_name", null: false
    t.text "extern_id"
    t.uuid "updated_by_id"
    t.text "updated_by_name"
    t.text "name", null: false
    t.string "file_file_name"
    t.string "file_content_type"
    t.bigint "file_file_size"
    t.datetime "file_updated_at"
    t.uuid "script_id", null: false
    t.index ["_state"], name: "index_script_inputs_on__state"
    t.index ["created_by_id"], name: "index_script_inputs_on_created_by_id"
    t.index ["extern_id"], name: "index_script_inputs_on_extern_id"
    t.index ["script_id"], name: "index_script_inputs_on_script_id"
    t.index ["updated_by_id"], name: "index_script_inputs_on_updated_by_id"
  end

  create_table "script_runs", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
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
    t.datetime "log_updated_at"
    t.string "status", default: "success", null: false
    t.uuid "script_id", null: false
    t.index ["_state"], name: "index_script_runs_on__state"
    t.index ["created_by_id"], name: "index_script_runs_on_created_by_id"
    t.index ["extern_id"], name: "index_script_runs_on_extern_id"
    t.index ["script_id"], name: "index_script_runs_on_script_id"
    t.index ["updated_by_id"], name: "index_script_runs_on_updated_by_id"
  end

  create_table "scripts", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "_state", default: 0, null: false
    t.uuid "created_by_id"
    t.text "created_by_name", null: false
    t.text "extern_id"
    t.uuid "updated_by_id"
    t.text "updated_by_name"
    t.text "body"
    t.text "title", null: false
    t.text "email_recipients", array: true
    t.json "script_fields"
    t.uuid "user_id", null: false
    t.index ["_state"], name: "index_scripts_on__state"
    t.index ["created_by_id"], name: "index_scripts_on_created_by_id"
    t.index ["extern_id"], name: "index_scripts_on_extern_id"
    t.index ["updated_by_id"], name: "index_scripts_on_updated_by_id"
    t.index ["user_id"], name: "index_scripts_on_user_id"
  end

  create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
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
    t.datetime "password_reset_token_expires_at"
    t.text "role", default: "tech", null: false
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

  add_foreign_key "locations", "users", column: "created_by_id"
  add_foreign_key "locations", "users", column: "updated_by_id"
  add_foreign_key "script_inputs", "scripts"
  add_foreign_key "script_inputs", "users", column: "created_by_id"
  add_foreign_key "script_inputs", "users", column: "updated_by_id"
  add_foreign_key "script_runs", "scripts"
  add_foreign_key "script_runs", "users", column: "created_by_id"
  add_foreign_key "script_runs", "users", column: "updated_by_id"
  add_foreign_key "scripts", "users"
  add_foreign_key "scripts", "users", column: "created_by_id"
  add_foreign_key "scripts", "users", column: "updated_by_id"
  add_foreign_key "users", "users", column: "created_by_id"
  add_foreign_key "users", "users", column: "updated_by_id"
end
