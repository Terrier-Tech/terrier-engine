class LocationTagLocation < ApplicationRecord

  belongs_to :location,     required: true
  belongs_to :location_tag, required: true

end