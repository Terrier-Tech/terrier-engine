class WorkOrders < ActiveRecord::Migration[7.0]
  def change

    change_column_default :users, :role, from: 'tech', to: nil

    add_column :locations, :address1, :text
    add_column :locations, :address2, :text
    add_column :locations, :zip, :text
    add_column :locations, :county, :text

    create_model :targets do |t|
      t.text :name, null: false
      t.text :description
      t.index :name, unique: true
    end

    create_model :invoices do |t|
      t.date :date, null: false
      t.text :status, null: false
      t.integer :price, null: false, default: 0
      t.references_uuid :location
      t.text :lines, array: true
    end

    create_model :work_orders do |t|
      t.timestamp :time
      t.text :status, null: false
      t.integer :price, null: false, default: 0
      t.references_uuid :location
      t.references_uuid :user
      t.references_uuid :invoice, null: true
      t.references_uuid :target, null: true
      t.text :notes
    end

    create_model :contacts do |t|
      t.references_uuid :location
      t.references_uuid :user
      t.text :contact_type, null: false
    end

  end
end
