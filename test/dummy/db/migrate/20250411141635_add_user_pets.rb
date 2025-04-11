class AddUserPets < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :pets, :json
  end
end
