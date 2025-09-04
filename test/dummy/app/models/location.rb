# Columns
# +-----------------+--------------+-------------------+
# | address1        | text         |                   |
# | address2        | text         |                   |
# | annual_value    | integer      |                   |
# | city            | text         |                   |
# | county          | text         |                   |
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
# | zip             | text         |                   |
# +-----------------+--------------+-------------------+
# 
# Associations
# +------------+-------------+-----------+
# | Has Many   | contacts    | Contact   |
# | Belongs To | created_by  | User      |
# | Has Many   | invoices    | Invoice   |
# | Belongs To | updated_by  | User      |
# | Has Many   | work_orders | WorkOrder |
# +------------+-------------+-----------+
class Location < ApplicationRecord

  has_many :work_orders, dependent: :restrict_with_error
  has_many :invoices, dependent: :restrict_with_error
  has_many :contacts, dependent: :restrict_with_error
  has_many :location_tags
  
  validates :display_name, presence: true
  validates :number, presence: true

  enum_field :status, %w[onetime contract]

  def self.metadata
    {
      description: "A location at which work is performed",
      visibility: "common",
      columns: {
        number: {
          description: "The location number",
          visibility: "common"
        },
        display_name: {
          description: "The name of the location",
          visibility: "common"
        }
      }
    }
  end
end