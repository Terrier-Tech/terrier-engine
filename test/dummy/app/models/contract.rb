# Columns
# +-----------------+--------------+-------------------+
# | created_at      | timestamp(6) | required          |
# | created_by_id   | uuid         | indexed           |
# | created_by_name | text         | required          |
# | extern_id       | text         | indexed           |
# | program_id      | uuid         | required, indexed |
# | updated_at      | timestamp(6) | required          |
# | updated_by_id   | uuid         | indexed           |
# | updated_by_name | text         |                   |
# +-----------------+--------------+-------------------+
# 
# Associations
# +------------+------------+---------+
# | Belongs To | created_by | User    |
# | Belongs To | program    | Program |
# | Belongs To | updated_by | User    |
# +------------+------------+---------+
class Contract < ApplicationRecord

  belongs_to :program

end