class LocationTags < ActiveRecord::Migration[7.1]
  def change
    create_model :location_tags do |t|
      t.text :name, null: false
    end

    create_model :location_tag_locations do |t|
      t.references_uuid :location
      t.references_uuid :location_tag
    end
  end
end
