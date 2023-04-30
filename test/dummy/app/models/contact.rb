# Columns
# +-----------------+--------------+-------------------+
# | contact_type    | text         | required          |
# | created_at      | timestamp(6) | required          |
# | created_by_id   | uuid         | indexed           |
# | created_by_name | text         | required          |
# | extern_id       | text         | indexed           |
# | location_id     | uuid         | required, indexed |
# | updated_at      | timestamp(6) | required          |
# | updated_by_id   | uuid         | indexed           |
# | updated_by_name | text         |                   |
# | user_id         | uuid         | required, indexed |
# +-----------------+--------------+-------------------+
# 
# Associations
# +------------+------------+----------+
# | Belongs To | created_by | User     |
# | Belongs To | location   | Location |
# | Belongs To | updated_by | User     |
# | Belongs To | user       | User     |
# +------------+------------+----------+
class Contact < ApplicationRecord

  belongs_to :user
  belongs_to :location

  enum_field :contact_type, %w[customer employee]
end