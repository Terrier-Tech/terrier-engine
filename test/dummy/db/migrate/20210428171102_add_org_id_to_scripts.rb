class AddOrgIdToScripts < ActiveRecord::Migration[5.2]
  #this is just for testing purposes, not a real :uuid
  def change
    add_column :scripts, :org_id, :text, null: true
    add_column :script_runs, :org_id, :text, null: true
  end
end
