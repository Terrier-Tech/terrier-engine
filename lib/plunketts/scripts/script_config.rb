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

end