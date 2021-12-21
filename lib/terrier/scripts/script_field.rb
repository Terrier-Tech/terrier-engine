class ScriptField
  include Terrier::Embedded

  field :name, type: String, required: true

  field :default_value, type: String, required: true

  field :values, type: String

  field :required, type: String

  enum_field :field_type, %w(date string select csv hidden)

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
    when 'hidden'
      s
    when 'csv'
      if s.blank?
        []
      else
        TabularIo.parse_csv s
      end
    else
      raise "Unknown field type #{type}"
    end
  end

  def compute_options
    return [] unless self.field_type == 'select'
    opts = eval(self.values)
    opts = opts.is_a?(Array) ? opts : []
    # don't add a blank space if there are no other options
    # this way, the field will appear as a hidden field
    if opts.size > 0 
      if opts.first.is_a? Array
        [['', nil]] + opts
      else
        [''] + opts
      end
    else
      opts
    end
  end

end