# Columns
# +-----------------+--------------+-----------------------+
# | created_at      | timestamp(6) | required              |
# | created_by_id   | uuid         | indexed               |
# | created_by_name | text         | required              |
# | dd_dive_id      | uuid         | required, indexed     |
# | extern_id       | text         | indexed               |
# | layout          | jsonb        | required, default: {} |
# | title           | text         | required              |
# | traces          | jsonb        | required, default: [] |
# | updated_at      | timestamp(6) | required              |
# | updated_by_id   | uuid         | indexed               |
# | updated_by_name | text         |                       |
# +-----------------+--------------+-----------------------+
# 
# Associations
# +------------+------------+--------+
# | Belongs To | created_by | User   |
# | Belongs To | dd_dive    | DdDive |
# | Belongs To | updated_by | User   |
# +------------+------------+--------+
class DdDivePlot < ApplicationRecord

  def self.metadata
    {
      visibility: "hidden"
    }
  end

  belongs_to :dd_dive

  validates :title, presence: true

  json_field :layout, {}, 'DivePlotLayout'

  json_field :traces, [], 'DivePlotTrace[]'



end