class DivePlots < ActiveRecord::Migration[7.1]
  def change

    create_model :dd_dive_plots do |t|
      t.text :title, null: false
      t.jsonb :traces, null: false, default: []
      t.jsonb :layout, null: false, default: {}
      t.references :dd_dive, null: false
    end

  end
end
