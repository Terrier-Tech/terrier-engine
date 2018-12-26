# Columns
# +-----------------+-----------+-------------------+
# | annual_value    | integer   |                   |
# | city            | text      |                   |
# | created_at      | timestamp | required          |
# | created_by_id   | uuid      | indexed           |
# | created_by_name | text      | required          |
# | data            | json      |                   |
# | display_name    | text      | required          |
# | extern_id       | text      | indexed           |
# | number          | integer   | required, indexed |
# | state           | text      |                   |
# | status          | text      | required, indexed |
# | tags            | text      | indexed           |
# | updated_at      | timestamp | required          |
# | updated_by_id   | uuid      | indexed           |
# | updated_by_name | text      |                   |
# +-----------------+-----------+-------------------+
class Location < ApplicationRecord

end