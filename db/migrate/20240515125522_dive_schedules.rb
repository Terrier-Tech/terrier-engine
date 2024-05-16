class DiveSchedules < ActiveRecord::Migration[7.1]
  def change

    add_column :dd_dives, :delivery_recipients, :text, array: true, null: false, default: []
    add_column :dd_dives, :delivery_schedule, :jsonb
    add_column :dd_dives, :delivery_mode, :text

    add_column :dd_dive_runs, :delivery_recipients, :text, array: true
    add_column :dd_dive_runs, :delivery_mode, :text
    add_column :dd_dive_runs, :delivery_status, :text

  end
end
