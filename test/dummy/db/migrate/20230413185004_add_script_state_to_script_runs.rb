class AddScriptStateToScriptRuns < ActiveRecord::Migration[5.2]
  def change
    add_column :script_runs, :script_body, :text, null: true
  end
end
