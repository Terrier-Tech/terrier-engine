# Columns
# +-----------------+--------------+----------------------+
# | created_at      | timestamp(6) | required             |
# | created_by_id   | uuid         | indexed              |
# | created_by_name | text         | required             |
# | date            | date         | required             |
# | extern_id       | text         | indexed              |
# | lines           | text[]       |                      |
# | location_id     | uuid         | required, indexed    |
# | price           | integer      | required, default: 0 |
# | status          | text         | required             |
# | updated_at      | timestamp(6) | required             |
# | updated_by_id   | uuid         | indexed              |
# | updated_by_name | text         |                      |
# +-----------------+--------------+----------------------+
# 
# Associations
# +------------+-------------+-----------+
# | Belongs To | created_by  | User      |
# | Belongs To | location    | Location  |
# | Belongs To | updated_by  | User      |
# | Has Many   | work_orders | WorkOrder |
# +------------+-------------+-----------+
class Invoice < ApplicationRecord

  belongs_to :location

  has_many :work_orders, dependent: :restrict_with_error

  cents_field :price

  date_field :date

  # compute the beginning of the month based on date
  # @return [String?] the month in '%Y-%m' format
  def month
    return nil if self.date.nil?
    self.date.strftime '%Y-%m'
  end

  enum_field :status, %w[pending open paid void]

  string_array_field :lines
end