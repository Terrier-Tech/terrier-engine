class AddScriptsScheduleHour < ActiveRecord::Migration[5.2]
  def change
    add_column :scripts, :schedule_hour, :integer, null: true
  end
end
