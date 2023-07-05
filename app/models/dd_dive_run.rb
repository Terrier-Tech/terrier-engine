# Columns
# +------------------+--------------+----------+
# | created_at       | timestamp(6) | required |
# | created_by_id    | uuid         | indexed  |
# | created_by_name  | text         | required |
# | dd_dive_id       | uuid         | indexed  |
# | extern_id        | text         | indexed  |
# | input_data       | jsonb        |          |
# | output_data      | jsonb        |          |
# | output_file_data | jsonb        |          |
# | status           | text         | required |
# | updated_at       | timestamp(6) | required |
# | updated_by_id    | uuid         | indexed  |
# | updated_by_name  | text         |          |
# +------------------+--------------+----------+
# 
# Associations
# +------------+------------+--------+
# | Belongs To | created_by | User   |
# | Belongs To | dd_dive    | DdDive |
# | Belongs To | updated_by | User   |
# +------------+------------+--------+
class DdDiveRun < ApplicationRecord

  belongs_to :dd_dive

  enum_field :status, %w[initial running success error]

  json_field :input_data, {}, {
    queries: 'Query[]',
    filters: 'FilterInput[]'
  }
  json_field :output_data

  include SpreadsheetUploader::Attachment(:output_file)

end