
EMAIL_SPLIT_REGEX = /[\s,;]+/

SLUG_REGEX = /([[:lower:]]|[0-9]+-?[[:lower:]])(-[[:lower:]0-9]+|[[:lower:]0-9])*/

# add values here that should always be upcased when displayed to the user
UPCASE_VALUES = %w[cod ace bce csr dot pca tpp it qal html pdf ach eft wdi wdo]

# these shouldn't be upcased, even though they're only two characters
UPCASE_BLACKLIST = %w[at by to is or]

GIGA = 1024 * 1024 * 1024
MEGA = 1024 * 1024
KILO = 1024

# needed to parse WKB geo points
if defined? RGeo
  RGEO_FACTORY = RGeo::Geographic.spherical_factory(
      wkb_parser: {support_ewkb: true}, wkb_generator: {hex_format: true, emit_ewkb_srid: true})
else
  RGEO_FACTORY = nil
end

class NilClass

  def is_true?
    false
  end

  def is_false?
    true
  end

  def is_float?
    false
  end

end

TRUTHY_STRINGS = %w[true t on 1]
FALSY_STRINGS = %w[false f off 0]

ANSI_CODE_CLASSES = {
  1 => 'bold',
  3 => 'italic',
  31 => 'red',
  32 => 'green',
  33 => 'yellow',
  34 => 'blue',
  36 => 'cyan'
}

class String

  def uncapitalize
    self[0, 1].downcase + self[1..-1]
  end

  def slugify
    self.strip.split(/[\s[[:punct:]]]+/).join('_').gsub(/[^\w\-.]/, '').downcase
  end

  def parse_postgres_array
    self.gsub('{', '').gsub('}', '').gsub('"', '').split(',')
  end

  def is_float?
    !!Float(self) rescue false
  end

  def is_true?
    !(TRUTHY_STRINGS.index(self.downcase.strip)).nil?
  end

  def is_false?
    !(FALSY_STRINGS.index(self.downcase.strip)).nil?
  end

  def to_bool
    TRUTHY_STRINGS.index self.downcase.strip
  end

  def smart_strip
    self.strip.gsub(/\A[[:space:]]+/, '').gsub(/[[:space:]]+\z/, '')
  end

  def smart_title
    lower_s = self.downcase
    if (self.length<3 and !UPCASE_BLACKLIST.index(lower_s)) or UPCASE_VALUES.index(lower_s)
      self.upcase
    else
      self.titleize
    end
  end

  def parse_geo_point
    if self.index('POINT')
      self.gsub('POINT (', '').gsub(')', '').strip.split(' ').map(&:to_f)
    else
      RGEO_FACTORY.parse_wkb self
    end
  end

  # returns the string with anything between parentheses
  def without_parens
    self.gsub(/\([\w\s]+\)/, '').strip
  end

  # converts a string containing terminal colors codes to an HTML string with .code-* spans
  def terminal_to_html
    self.gsub("\e[0m", '</span>')
             .gsub(/\e\[([\d;]+)m/) do
      codes = $1.split(';')
      classes = codes.map { |code| ANSI_CODE_CLASSES[code.to_i] }.compact.map { |c| "code-#{c}" }
      "<span class='#{classes.join(' ')}'>"
    end
  end

  # creates a data URL of the string of the given mime type
  def to_base64_data_url(mime_type = "image/svg+xml")
    base64_data = Base64.strict_encode64(self)
    "data:#{mime_type};base64,#{base64_data}"
  end

end


class Float

  def to_ms
    (self*1000).round(1)
  end

  def is_float?
    true
  end

  def dollars(include_cents=true)
    precision = include_cents ? 2 : 0
    ActionController::Base.helpers.number_to_currency self, precision: precision
  end

  def percent
    '%g%%' % (self*100.0)
  end

end

class Integer

  def cents(include_cents=true)
    precision = include_cents ? 2 : 0
    ActionController::Base.helpers.number_to_currency self/100.0, precision: precision
  end

  def dollars(include_cents=true)
    precision = include_cents ? 2 : 0
    ActionController::Base.helpers.number_to_currency self, precision: precision
  end

end


class Array

  # wraps each element in single quotes, joins them with commas, and wraps the whole thing in parentheses
  def to_postgres_array
    '(' + self.map{|a| "'#{a}'"}.join(',') + ')'
  end

  def to_postgres_array_literal
    str = self.join('", "')
    str = "{\"#{str}\"}"
    str
  end

  def mean
    self.sum / self.size.to_f
  end

  # remove unnecessary leading directories from backtrace lines
  def filter_backtrace
    dir = Dir.pwd.split('/')[0..-2].join('/') + '/'
    self.map do |line|
      if line.starts_with? dir
        line.gsub dir, ''
      elsif line.index '/gems/'
        'gems/' + line.split('/gems/').last
      elsif line.index '/rubygems/'
        'rubygems/' + line.split('/rubygems/').last
      elsif line.index '/ruby/'
        'ruby/' + line.split('/ruby/').last
      else
        line
      end
    end
  end

end


class Hash

  # creates a new hash with all keys as symbols
  def symbolize
    h = {}
    self.each do |k, v|
      h[k.to_sym] = v
    end
    h
  end
end

class TrueClass
  def is_true?
    true
  end
  def is_false?
    false
  end
end

class FalseClass
  def is_true?
    false
  end
  def is_false?
    true
  end
end