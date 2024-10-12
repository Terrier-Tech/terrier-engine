# Columns
# +------------------+-------------------+----------------------------+
# | backtrace        | text[]            |                            |
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
# | org_id           | text              |                            |
# | script_body      | text              |                            |
# | script_id        | uuid              | required, indexed          |
# | status           | character varying | required, default: success |
# | updated_at       | timestamp         | required                   |
# | updated_by_id    | uuid              | indexed                    |
# | updated_by_name  | text              |                            |
# +------------------+-------------------+----------------------------+
# 
# Associations
# +------------+------------+--------+
# | Belongs To | created_by | User   |
# | Belongs To | script     | Script |
# | Belongs To | updated_by | User   |
# +------------+------------+--------+
class ScriptRun < ApplicationRecord
  include Terrier::ScriptRunBase

  def self.metadata
    {
      visibility: "hidden"
    }
  end

  has_attached_file :log
  validates_attachment_content_type :log, content_type: %w(text/plain text/html)


  def write_log(body)

    if body.blank?
      body = 'empty log'
    end
    body = body.strip.force_encoding(Encoding::UTF_8)

    self.log = StringIO.new body
    self.log_file_name = "#{self.created_at.strftime('%Y-%m-%d_%H-%M-%S')}_script-#{self.script_id}.txt"
    self.log_url
  end

  def log_url
    self.log.url
  end

  def filtered_fields
    SqlBuilder.new
              .with("jsonb_data as (select fields from script_runs where id = '#{self.id}')")
              .select('jsonb_object_agg(key, value) as fields')
              .from('jsonb_data, jsonb_each(jsonb_data.fields::jsonb)')
              .where("jsonb_typeof(value) != 'array'")
              .as_objects
              .exec.to_a.first.fields
  end
end