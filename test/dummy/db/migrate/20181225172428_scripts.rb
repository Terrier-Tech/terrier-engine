class Scripts < ActiveRecord::Migration[5.2]
  def change
    enable_extension 'pgcrypto' unless extension_enabled?('pgcrypto')

    create_model :users do |t|
      t.text :address1
      t.text :address2
      t.text :city
      t.text :county
      t.text :email, index: {unique: true}
      t.text :first_name, null: false
      t.time :last_logged_in_at
      t.text :last_name, null: false
      t.text :notes_html
      t.text :notes_raw
      t.text :password_digest, null: false
      t.text :password_reset_token
      t.timestamp :password_reset_token_expires_at
      t.text :role, null: false, default: 'tech', index: true
      t.text :state
      t.text :tags, array: true, index: true, null: false, default: '{}'
      t.text :zip
    end

    create_model :scripts do |t|
      t.text :body
      t.text :title, null: false
      t.text :email_recipients, array: true
      t.json :script_fields
      t.text :report_category
      t.references_uuid :user
    end

    create_model :script_runs do |t|
      t.float :duration
      t.text :exception
      t.text :backtrace, array: true
      t.json :fields
      t.has_attached_file :log
      t.string :status, null: false, default: 'success'
      t.references_uuid :script
    end

    create_model :script_inputs do |t|
      t.text :name, null: false
      t.has_attached_file :file
      t.references_uuid :script
    end

    create_model :locations do |t|
      t.integer :annual_value
      t.text :city
      t.text :state
      t.text :display_name, null: false
      t.integer :number, null: false, index: true
      t.text :tags, array: true, index: true
      t.text :status, null: false, index: true
      t.json :data
    end

  end
end
