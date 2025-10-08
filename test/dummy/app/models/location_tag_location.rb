# Columns
# +-----------------+--------------+-------------------+
# | created_at      | timestamp(6) | required          |
# | created_by_id   | uuid         | indexed           |
# | created_by_name | text         | required          |
# | extern_id       | text         | indexed           |
# | location_id     | uuid         | required, indexed |
# | location_tag_id | uuid         | required, indexed |
# | updated_at      | timestamp(6) | required          |
# | updated_by_id   | uuid         | indexed           |
# | updated_by_name | text         |                   |
# +-----------------+--------------+-------------------+
# 
# Associations
# +------------+--------------+-------------+
# | Belongs To | created_by   | User        |
# | Belongs To | location     | Location    |
# | Belongs To | location_tag | LocationTag |
# | Belongs To | updated_by   | User        |
# +------------+--------------+-------------+
class LocationTagLocation < ApplicationRecord

  belongs_to :location,     required: true
  belongs_to :location_tag, required: true

end