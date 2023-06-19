# Columns
# +------------------+--------------+----------+
# | created_at       | timestamp(6) | required |
# | created_by_id    | uuid         | indexed  |
# | created_by_name  | text         | required |
# | data             | jsonb        |          |
# | dd_dive_group_id | uuid         | indexed  |
# | description_html | text         |          |
# | description_raw  | text         |          |
# | extern_id        | text         | indexed  |
# | name             | text         | required |
# | owner_id         | uuid         | indexed  |
# | updated_at       | timestamp(6) | required |
# | updated_by_id    | uuid         | indexed  |
# | updated_by_name  | text         |          |
# | visibility       | text         | required |
# +------------------+--------------+----------+
# 
# Associations
# +------------+---------------+-------------+
# | Belongs To | created_by    | User        |
# | Belongs To | dd_dive_group | DdDiveGroup |
# | Has Many   | dd_dive_runs  | DdDiveRun   |
# | Belongs To | updated_by    | User        |
# +------------+---------------+-------------+
class DdDive < ApplicationRecord

  belongs_to :dd_dive_group, optional: true

  has_many :dd_dive_runs, dependent: :restrict_with_error

end