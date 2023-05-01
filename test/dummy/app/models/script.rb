# Columns
# +-------------------------+-----------+----------------------------+
# | body                    | text      |                            |
# | created_at              | timestamp | required                   |
# | created_by_id           | uuid      | indexed                    |
# | created_by_name         | text      | required                   |
# | description             | text      |                            |
# | email_recipients        | text[]    |                            |
# | extern_id               | text      | indexed                    |
# | num_per_year            | integer   | required, default: 0       |
# | order_grouping          | text      | required, default: combine |
# | org_id                  | text      |                            |
# | report_category         | text      |                            |
# | schedule_rule_summaries | text[]    |                            |
# | schedule_rules          | json      |                            |
# | schedule_time           | text      | required, default: none    |
# | schedule_type           | text      | required, default: every   |
# | script_fields           | json      |                            |
# | title                   | text      | required                   |
# | updated_at              | timestamp | required                   |
# | updated_by_id           | uuid      | indexed                    |
# | updated_by_name         | text      |                            |
# | visibility              | text      | required, default: private |
# +-------------------------+-----------+----------------------------+
# 
# Associations
# +------------+-------------+-----------+
# | Belongs To | created_by  | User      |
# | Has Many   | script_runs | ScriptRun |
# | Belongs To | updated_by  | User      |
# +------------+-------------+-----------+
class Script < ApplicationRecord
  include Terrier::ScriptBase
  include Terrier::FullTextSearch

  can_full_text_search :body
  can_full_text_search :title
  can_full_text_search :description

  validates :title, uniqueness: true

  has_many :script_runs
end