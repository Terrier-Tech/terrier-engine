
EMAIL_SPLIT_REGEX = /[\s,;]+/

SLUG_REGEX = /([[:lower:]]|[0-9]+-?[[:lower:]])(-[[:lower:]0-9]+|[[:lower:]0-9])*/

# add values here that should always be upcased when displayed to the user
UPCASE_VALUES = %w(cod csr html pdf ach eft)

# these shouldn't be upcased, even though they're only two characters
UPCASE_BLACKLIST = %w(at by to is or)

PRETTY_DATE_FORMAT = '%B %e, %Y'
SHORT_DATE_FORMAT = '%m/%d/%y'
SQL_DATE_FORMAT = '%Y-%m-%d'
SQL_TIME_FORMAT = "#{SQL_DATE_FORMAT} %H:%M:%S%z"
PRETTY_TIME_FORMAT = "#{SHORT_DATE_FORMAT} %l:%M %p"
SHORT_TIME_FORMAT = "%l:%M %p"

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

  def is_float?
    false
  end

end

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
    !(%w(true 1 on).index(self.downcase.strip)).nil?
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
end

class FalseClass
  def is_true?
    false
  end
end