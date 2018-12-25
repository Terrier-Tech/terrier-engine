class Scripts < ActiveRecord::Migration[5.2]
  def change

    create_table :scripts do |t|
      t.timestamps
      t.text :created_by_name
      t.text :updated_by_name
      t.text :body
      t.text :title, null: false
      t.text :email_recipients, array: true
      t.json :script_fields
    end

    create_table :locations do |t|
      t.timestamps
      t.integer :annual_value
      t.text :city
      t.text :state
      t.text :created_by_name
      t.text :updated_by_name
      t.text :display_name, null: false
      t.integer :number, null: false, index: true
      t.text :tags, array: true, index: true
      t.text :status, null: false, index: true
      t.json :data
    end

  end
end
