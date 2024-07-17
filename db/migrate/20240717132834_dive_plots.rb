class DivePlots < ActiveRecord::Migration[7.1]
  def change

    add_column :dd_dives, :plot_data, :jsonb

  end
end
