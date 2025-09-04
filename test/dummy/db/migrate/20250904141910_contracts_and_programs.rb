class ContractsAndPrograms < ActiveRecord::Migration[7.1]
  def change
    create_model :programs do |t|
    end
    
    create_model :contracts do |t|
      t.references_uuid :program
    end
    
    create_model :location_sales do |t|
      t.references_uuid :contract
    end
  end
end
