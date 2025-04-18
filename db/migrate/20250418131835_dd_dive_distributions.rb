class DdDiveDistributions < ActiveRecord::Migration[7.1]
  def change

    create_model :dd_dive_distributions do |t|
      t.references :dd_dive
      t.text :recipients, array: true, default: []
      t.jsonb :schedule, null: false, default: {}
      t.text :notes
    end

    add_foreign_key_column :dd_dive_runs, :dd_dive_distributions, type: :uuid

  end
end
