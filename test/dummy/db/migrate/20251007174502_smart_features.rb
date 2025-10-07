class SmartFeatures < ActiveRecord::Migration[7.1]
  def change

    create_model :smart_features do |t|
      t.string :name, null: false
      t.string :feature_type, null: false
      t.text :description
      t.jsonb :data, null: false, default: {}
    end

  end
end
