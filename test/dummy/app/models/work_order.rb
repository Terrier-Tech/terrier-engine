# Columns
# +-----------------+--------------+----------------------+
# | created_at      | timestamp(6) | required             |
# | created_by_id   | uuid         | indexed              |
# | created_by_name | text         | required             |
# | extern_id       | text         | indexed              |
# | invoice_id      | uuid         | indexed              |
# | location_id     | uuid         | required, indexed    |
# | notes           | text         |                      |
# | price           | integer      | required, default: 0 |
# | status          | text         | required             |
# | target_id       | uuid         | indexed              |
# | time            | timestamp    |                      |
# | updated_at      | timestamp(6) | required             |
# | updated_by_id   | uuid         | indexed              |
# | updated_by_name | text         |                      |
# | user_id         | uuid         | required, indexed    |
# +-----------------+--------------+----------------------+
# 
# Associations
# +------------+------------+----------+
# | Belongs To | created_by | User     |
# | Belongs To | invoice    | Invoice  |
# | Belongs To | location   | Location |
# | Belongs To | target     | Target   |
# | Belongs To | updated_by | User     |
# | Belongs To | user       | User     |
# +------------+------------+----------+
class WorkOrder < ApplicationRecord

  belongs_to :target, optional: true
  belongs_to :invoice, optional: true

  belongs_to :location
  belongs_to :user

  enum_field :status, %w[active complete cancelled followup on_demand paused in_progress]

  cents_field :price

  def self.metadata
    {
      description: "Work being performed at a location",
      visibility: "common",
      columns: {
        time: {
          description: "Either the scheduled or start time of the order, depending on if it's been started",
          visibility: "common"
        },
        price: {
          description: "The production amount on the order",
          visibility: "common"
        }
      }
    }
  end

  # compute the beginning of the month based on time
  # @return [String?] the month in '%Y-%m' format
  def month
    return nil if self.time.nil?
    self.time.strftime '%Y-%m'
  end
end