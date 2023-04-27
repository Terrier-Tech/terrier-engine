# Columns
# +-----------------+--------------+-------------------+
# | annual_value    | integer      |                   |
# | city            | text         |                   |
# | created_at      | timestamp(6) | required          |
# | created_by_id   | uuid         | indexed           |
# | created_by_name | text         | required          |
# | data            | json         |                   |
# | display_name    | text         | required          |
# | extern_id       | text         | indexed           |
# | number          | integer      | required, indexed |
# | state           | text         |                   |
# | status          | text         | required, indexed |
# | tags            | text[]       | indexed           |
# | updated_at      | timestamp(6) | required          |
# | updated_by_id   | uuid         | indexed           |
# | updated_by_name | text         |                   |
# +-----------------+--------------+-------------------+
# 
# Associations
# +------------+------------+------+
# | Belongs To | created_by | User |
# | Belongs To | updated_by | User |
# +------------+------------+------+
class Location < ApplicationRecord

end