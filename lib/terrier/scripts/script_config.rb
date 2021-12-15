module Terrier::ScriptConfig

  @values = {
      category_icons: {},
      report_type_icons: {},
      fields_help: ''
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