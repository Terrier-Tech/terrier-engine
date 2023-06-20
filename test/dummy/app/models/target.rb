# Columns
# +-----------------+--------------+-------------------+
# | created_at      | timestamp(6) | required          |
# | created_by_id   | uuid         | indexed           |
# | created_by_name | text         | required          |
# | description     | text         |                   |
# | extern_id       | text         | indexed           |
# | name            | text         | required, indexed |
# | updated_at      | timestamp(6) | required          |
# | updated_by_id   | uuid         | indexed           |
# | updated_by_name | text         |                   |
# +-----------------+--------------+-------------------+
# 
# Associations
# +------------+-------------+-----------+
# | Belongs To | created_by  | User      |
# | Belongs To | updated_by  | User      |
# | Has Many   | work_orders | WorkOrder |
# +------------+-------------+-----------+
class Target < ApplicationRecord

  def self.exclude_from_frontend?
    true
  end

  has_many :work_orders, dependent: :restrict_with_error

  def self.metadata
    {
      description: "The target pests of work orders"
    }
  end

end