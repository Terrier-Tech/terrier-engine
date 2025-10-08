# Columns
# +-----------------+-------------------+-----------------------+
# | created_at      | timestamp(6)      | required              |
# | created_by_id   | uuid              | indexed               |
# | created_by_name | text              | required              |
# | data            | jsonb             | required, default: {} |
# | description     | text              |                       |
# | extern_id       | text              | indexed               |
# | feature_type    | character varying | required              |
# | name            | character varying | required              |
# | updated_at      | timestamp(6)      | required              |
# | updated_by_id   | uuid              | indexed               |
# | updated_by_name | text              |                       |
# +-----------------+-------------------+-----------------------+
# 
# Associations
# +------------+------------+------+
# | Belongs To | created_by | User |
# | Belongs To | updated_by | User |
# +------------+------------+------+
class Smart::SmartFeature < ApplicationRecord

  enum_field :feature_type, %w[test]

  json_field :data, {}

end