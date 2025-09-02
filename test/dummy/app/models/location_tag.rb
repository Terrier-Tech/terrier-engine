class LocationTag < ApplicationRecord
  
  has_many :location_tag_locations, -> { where(_state: 0) }
  has_many :locations, through: :location_tag_locations
  
end