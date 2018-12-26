class ScriptField
  include Plunketts::Embedded

  field :name, type: String, required: true

  field :default_value, type: String, required: true

  field :values, type: String

  enum_field :field_type, %w(date string select csv)

  def self.compute_date_value(s)
    if s =~ /\d{4}-\d{2}-\d{2}/
      Time.parse s
    else
      eval(s)
    end
  end

  def self.compute_value(type, s)
    case type
    when 'date'
      compute_date_value s
    when 'string'
      s
    when 'select'
      s
    when 'csv'
      if s.blank?
        []
      else
        CsvIo.parse s
      end
    else
      raise "Unknown field type #{type}"
    end
  end

  def compute_options
    return [] unless self.field_type == 'select'
    opts = eval(self.values)
    opts = opts.is_a?(Array) ? opts : []
    [''] + opts
  end

end