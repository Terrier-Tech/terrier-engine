# Columns
# +------------------+-----------+-------------------+
# | body             | text      |                   |
# | created_at       | timestamp | required          |
# | created_by_id    | uuid      | indexed           |
# | created_by_name  | text      | required          |
# | email_recipients | text      |                   |
# | extern_id        | text      | indexed           |
# | script_fields    | json      |                   |
# | title            | text      | required          |
# | updated_at       | timestamp | required          |
# | updated_by_id    | uuid      | indexed           |
# | updated_by_name  | text      |                   |
# | user_id          | uuid      | required, indexed |
# +------------------+-----------+-------------------+
class Script < ApplicationRecord
  include Plunketts::ScriptBase


  validates :title, uniqueness: true
end