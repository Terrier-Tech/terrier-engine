

module MyColumnMethods

  def references_uuid(other, options={})
    options[:type] = :uuid
    options[:index] = true
    options[:foreign_key] = true
    unless options.has_key? :null
      options[:null] = false
    end
    self.references other, options
  end

  # creates a non-null, default 0 integer column
  def cents(name, options={})
    options[:null] = false unless options.has_key?(:null)
    options[:default] = false unless options.has_key?(:default)
    self.integer name, options
  end


end

class ActiveRecord::Migration

  # this should be used in migrations instead of create_table
  def create_model(name)
    create_table name, id: :uuid, default: 'gen_random_uuid()' do |t|
      t.timestamps
      t.integer :_state, default: 0, null: false, index: true
      t.uuid :created_by_id, index: true
      t.text :created_by_name, null: false
      t.text :extern_id, index: true
      t.uuid :updated_by_id, index: true
      t.text :updated_by_name
      t.class.include MyColumnMethods
      yield t
    end
    add_foreign_key name, :users, column: :created_by_id
    add_foreign_key name, :users, column: :updated_by_id
  end

  # this should be used to create tables that belong to an org
  def create_org_model(name)
    create_model name do |t|
      t.references_uuid :org
      yield t
    end
  end

  def add_markdown_field(table, name)
    add_column table, "#{name}_raw".to_sym, :text
    add_column table, "#{name}_html".to_sym, :text
  end

  # adds a reference to to_table on from_table, plus an index and foreign key
  # pass a type option if it needs to be something other than text
  def add_foreign_key_column(from_table, to_table, options = {})
    column = options[:column].presence || (to_table.to_s.singularize + '_id')
    type = options[:type].presence || :text
    add_column from_table, column, type
    if !options.has_key?(:index) || options[:index]
      add_index from_table, column
    end
    add_foreign_key from_table, to_table, column: column
  end

  def add_indexed_column(table, name, type)
    add_column table, name, type
    add_index table, name
  end


end
