# include this module in the ScriptRun model
module Terrier::ScriptRunBase
  extend ActiveSupport::Concern

  included do

    belongs_to :script

    enum_field :status, %w(running success error cancelled cleared)

    validates :duration, presence: true

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

end
