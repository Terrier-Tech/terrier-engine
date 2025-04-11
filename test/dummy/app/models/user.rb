#
class Pet
  include Terrier::Embedded

  field :name, type: String
  field :species, type: String, required: false
end

# Columns
# +---------------------------------+-----------+--------------------------------+
# | address1                        | text      |                                |
# | address2                        | text      |                                |
# | city                            | text      |                                |
# | county                          | text      |                                |
# | created_at                      | timestamp | required                       |
# | created_by_id                   | uuid      | indexed                        |
# | created_by_name                 | text      | required                       |
# | email                           | text      | indexed                        |
# | extern_id                       | text      | indexed                        |
# | first_name                      | text      | required                       |
# | last_logged_in_at               | time      |                                |
# | last_name                       | text      | required                       |
# | notes_html                      | text      |                                |
# | notes_raw                       | text      |                                |
# | password_digest                 | text      | required                       |
# | password_reset_token            | text      |                                |
# | password_reset_token_expires_at | timestamp |                                |
# | role                            | text      | required, indexed              |
# | state                           | text      |                                |
# | tags                            | text[]    | required, indexed, default: {} |
# | updated_at                      | timestamp | required                       |
# | updated_by_id                   | uuid      | indexed                        |
# | updated_by_name                 | text      |                                |
# | zip                             | text      |                                |
# +---------------------------------+-----------+--------------------------------+
# 
# Associations
# +------------+-------------+-----------+
# | Has Many   | contacts    | Contact   |
# | Belongs To | created_by  | User      |
# | Belongs To | updated_by  | User      |
# | Has Many   | work_orders | WorkOrder |
# +------------+-------------+-----------+
class User < ApplicationRecord
  include Terrier::Embedder
  include ActiveModel::SecurePassword
  has_secure_password

  has_many :work_orders, dependent: :restrict_with_error
  has_many :contacts, dependent: :restrict_with_error

  def full_name
    [self.first_name, self.last_name].compact.join(' ')
  end

  enum_field :role, %w[technician office customer]

  string_array_field :tags

  def generate_password
    self.password = SecureRandom.base36(12)
    self.password_confirmation = self.password
  end

  embeds_many :pets, class: Pet
end

