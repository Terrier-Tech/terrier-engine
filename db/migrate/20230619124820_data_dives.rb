class DataDives < ActiveRecord::Migration[7.0]
  def change

    create_model :dd_dive_groups do |t|
      t.text :name, null: false
      t.text :icon
      t.text :description
      t.integer :sort_order
      t.text :group_types, array: true, null: false, default: []
    end

    create_model :dd_dives do |t|
      t.references :owner, foreign_key: {to_table: :users}, index: {name: :dd_dive_owners}, null: true
      t.references :dd_dive_group, null: true
      t.text :name, null: false
      t.text :description_raw
      t.text :description_html
      t.text :visibility, null: false
      t.jsonb :data
    end

    create_model :dd_dive_runs do |t|
      t.references :dd_dive
      t.jsonb :input_data
      t.jsonb :output_data
      t.jsonb :output_file
      t.text :status, null: false

    end

  end
end
