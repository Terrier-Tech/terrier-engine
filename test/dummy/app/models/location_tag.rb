# Columns
# +-----------------+--------------+----------+
# | created_at      | timestamp(6) | required |
# | created_by_id   | uuid         | indexed  |
# | created_by_name | text         | required |
# | extern_id       | text         | indexed  |
# | name            | text         | required |
# | updated_at      | timestamp(6) | required |
# | updated_by_id   | uuid         | indexed  |
# | updated_by_name | text         |          |
# +-----------------+--------------+----------+
# 
# Associations
# +------------+------------------------+---------------------+
# | Belongs To | created_by             | User                |
# | Has Many   | location_tag_locations | LocationTagLocation |
# | Has Many   | locations              | Location            |
# | Belongs To | updated_by             | User                |
# +------------+------------------------+---------------------+
class LocationTag < ApplicationRecord
  
  has_many :location_tag_locations, -> { where(_state: 0) }
  has_many :locations, through: :location_tag_locations
  
end