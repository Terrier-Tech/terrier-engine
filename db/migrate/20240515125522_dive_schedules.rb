class DiveSchedules < ActiveRecord::Migration[7.1]
  def change

    add_column :dd_dives, :delivery_recipients, :text
    add_column :dd_dives, :delivery_schedule, :jsonb
    add_column :dd_dives, :delivery_mode, :text

  end
end
