module Terrier::ScriptConfig

  @@added_fields = []

  def self.added_fields
    @@added_fields
  end

  # Must be passed a hash containing the key, title, and options
  # for example:
  # Terrier::ScriptConfig.add_field({
  #    key: :org_id,
  #    title: 'Organization',
  #    options: -> {Org.options},
  #    text_field: false
  #   })
  # Currently supports only select drop downs and input text fields
  def self.add_field(field)
    @@added_fields.append field
  end

  @values = {
      category_icons: {},
      report_type_icons: {}
  }

  @values.keys.each do |key|
    define_singleton_method "#{key}=" do |val|
      @values[key] = val
    end
    define_singleton_method key do
      @values[key]
    end
  end

  def self.category_options
    @values[:category_icons].map do |k, v|
      [k.to_s.titleize, v, k]
    end
  end

  def self.report_type_options
    @values[:report_type_icons].map do |k, v|
      [k.to_s.titleize, v, k]
    end
  end

end