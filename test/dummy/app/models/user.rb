# Columns
# +---------------------------------+--------------+----------------------------------+
# | address1                        | text         |                                  |
# | address2                        | text         |                                  |
# | city                            | text         |                                  |
# | county                          | text         |                                  |
# | created_at                      | timestamp(6) | required                         |
# | created_by_id                   | uuid         | indexed                          |
# | created_by_name                 | text         | required                         |
# | email                           | text         | indexed                          |
# | extern_id                       | text         | indexed                          |
# | first_name                      | text         | required                         |
# | last_logged_in_at               | time         |                                  |
# | last_name                       | text         | required                         |
# | notes_html                      | text         |                                  |
# | notes_raw                       | text         |                                  |
# | password_digest                 | text         | required                         |
# | password_reset_token            | text         |                                  |
# | password_reset_token_expires_at | timestamp(6) |                                  |
# | role                            | text         | required, indexed, default: tech |
# | state                           | text         |                                  |
# | tags                            | text[]       | required, indexed, default: {}   |
# | updated_at                      | timestamp(6) | required                         |
# | updated_by_id                   | uuid         | indexed                          |
# | updated_by_name                 | text         |                                  |
# | zip                             | text         |                                  |
# +---------------------------------+--------------+----------------------------------+
# 
# Associations
# +------------+------------+------+
# | Belongs To | created_by | User |
# | Belongs To | updated_by | User |
# +------------+------------+------+
class User < ApplicationRecord

end