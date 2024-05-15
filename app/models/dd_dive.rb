# Columns
# +---------------------+--------------+-----------------------+
# | created_at          | timestamp(6) | required              |
# | created_by_id       | uuid         | indexed               |
# | created_by_name     | text         | required              |
# | dd_dive_group_id    | uuid         | indexed               |
# | delivery_mode       | text         |                       |
# | delivery_recipients | text         |                       |
# | delivery_schedule   | jsonb        |                       |
# | description_html    | text         |                       |
# | description_raw     | text         |                       |
# | dive_types          | text[]       | required, default: {} |
# | extern_id           | text         | indexed               |
# | name                | text         | required              |
# | owner_id            | uuid         | indexed               |
# | query_data          | jsonb        |                       |
# | sort_order          | integer      |                       |
# | updated_at          | timestamp(6) | required              |
# | updated_by_id       | uuid         | indexed               |
# | updated_by_name     | text         |                       |
# | visibility          | text         | required              |
# +---------------------+--------------+-----------------------+
# 
# Associations
# +------------+---------------+-------------+
# | Belongs To | created_by    | User        |
# | Belongs To | dd_dive_group | DdDiveGroup |
# | Has Many   | dd_dive_runs  | DdDiveRun   |
# | Belongs To | owner         | User        |
# | Belongs To | updated_by    | User        |
# +------------+---------------+-------------+
class DdDive < ApplicationRecord

  def self.metadata
    {
      visibility: "hidden"
    }
  end

  belongs_to :dd_dive_group, optional: true

  has_many :dd_dive_runs, dependent: :restrict_with_error

  validates :name, presence: true

  markdown_field :description

  belongs_to :owner, class_name: 'User', optional: true

  json_field :query_data, {}, {
    queries: 'Query[]'
  }

  string_array_field :dive_types

  enum_field :visibility, %w[public private]


  ## Delivery

  enum_field :delivery_mode, %w[always present], optional: true

  email_field :recipients

  json_field :delivery_schedule


end