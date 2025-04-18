# Columns
# +-----------------+--------------+-----------------------+
# | created_at      | timestamp(6) | required              |
# | created_by_id   | uuid         | indexed               |
# | created_by_name | text         | required              |
# | dd_dive_id      | uuid         | indexed               |
# | extern_id       | text         | indexed               |
# | notes           | text         |                       |
# | recipients      | text[]       | default: {}           |
# | schedule        | jsonb        | required, default: {} |
# | updated_at      | timestamp(6) | required              |
# | updated_by_id   | uuid         | indexed               |
# | updated_by_name | text         |                       |
# +-----------------+--------------+-----------------------+
# 
# Associations
# +------------+--------------+-----------+
# | Belongs To | created_by   | User      |
# | Has Many   | dd_dive_runs | DdDiveRun |
# | Belongs To | updated_by   | User      |
# +------------+--------------+-----------+
class DdDiveDistribution < ApplicationRecord

  has_many :dd_dive_runs,  dependent: :restrict_with_error

  emails_field :recipients

  json_field :schedule, {}, 'RegularSchedule'

end