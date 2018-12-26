# Columns
# +------------------+-------------------+----------------------------+
# | backtrace        | text              |                            |
# | created_at       | timestamp         | required                   |
# | created_by_id    | uuid              | indexed                    |
# | created_by_name  | text              | required                   |
# | duration         | double precision  |                            |
# | exception        | text              |                            |
# | extern_id        | text              | indexed                    |
# | fields           | json              |                            |
# | log_content_type | character varying |                            |
# | log_file_name    | character varying |                            |
# | log_file_size    | bigint            |                            |
# | log_updated_at   | timestamp         |                            |
# | script_id        | uuid              | required, indexed          |
# | status           | character varying | required, default: success |
# | updated_at       | timestamp         | required                   |
# | updated_by_id    | uuid              | indexed                    |
# | updated_by_name  | text              |                            |
# +------------------+-------------------+----------------------------+
class ScriptRun < ApplicationRecord



end