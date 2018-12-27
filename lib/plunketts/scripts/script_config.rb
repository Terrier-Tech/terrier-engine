module Plunketts::ScriptConfig

  @values = {
      category_icons: {}
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

end