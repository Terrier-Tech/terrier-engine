class DiveSchedules < ActiveRecord::Migration[7.1]
  def change

    add_column :dd_dives, :delivery_recipients, :text, array: true
    add_column :dd_dives, :delivery_schedule, :jsonb

    add_column :dd_dive_runs, :delivery_recipients, :text, array: true
    add_index :dd_dive_runs, :delivery_recipients, using: :gin
    add_column :dd_dive_runs, :delivery_data, :jsonb


  end
end
