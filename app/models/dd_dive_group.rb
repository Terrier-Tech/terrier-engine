# Columns
# +-----------------+--------------+-----------------------+
# | created_at      | timestamp(6) | required              |
# | created_by_id   | uuid         | indexed               |
# | created_by_name | text         | required              |
# | description     | text         |                       |
# | extern_id       | text         | indexed               |
# | group_types     | text[]       | required, default: {} |
# | icon            | text         |                       |
# | name            | text         | required              |
# | sort_order      | integer      |                       |
# | updated_at      | timestamp(6) | required              |
# | updated_by_id   | uuid         | indexed               |
# | updated_by_name | text         |                       |
# +-----------------+--------------+-----------------------+
# 
# Associations
# +------------+------------+--------+
# | Belongs To | created_by | User   |
# | Has Many   | dd_dives   | DdDife |
# | Belongs To | updated_by | User   |
# +------------+------------+--------+
class DdDiveGroup < ApplicationRecord

  has_many :dd_dives, dependent: :restrict_with_error

end