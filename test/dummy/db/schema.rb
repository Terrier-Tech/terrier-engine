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
  enable_extension "plpgsql"

  create_table "locations", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "annual_value"
    t.text "city"
    t.text "state"
    t.text "created_by_name"
    t.text "updated_by_name"
    t.text "display_name", null: false
    t.integer "number", null: false
    t.text "tags", array: true
    t.text "status", null: false
    t.json "data"
    t.index ["number"], name: "index_locations_on_number"
    t.index ["status"], name: "index_locations_on_status"
    t.index ["tags"], name: "index_locations_on_tags"
  end

  create_table "scripts", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "created_by_name"
    t.text "updated_by_name"
    t.text "body"
    t.text "title", null: false
    t.text "email_recipients", array: true
    t.json "script_fields"
  end

end
