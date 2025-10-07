# Columns
# +-----------------+--------------+-------------------+
# | contract_id     | uuid         | required, indexed |
# | created_at      | timestamp(6) | required          |
# | created_by_id   | uuid         | indexed           |
# | created_by_name | text         | required          |
# | extern_id       | text         | indexed           |
# | updated_at      | timestamp(6) | required          |
# | updated_by_id   | uuid         | indexed           |
# | updated_by_name | text         |                   |
# +-----------------+--------------+-------------------+
# 
# Associations
# +------------+------------+----------+
# | Belongs To | contract   | Contract |
# | Belongs To | created_by | User     |
# | Has Many   | program    | Program  |
# | Belongs To | updated_by | User     |
# +------------+------------+----------+
class LocationSale < ApplicationRecord

  belongs_to :contract
  has_one :program, through: :contract

end