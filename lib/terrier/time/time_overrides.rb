
# Formats
PRETTY_DATE_FORMAT = '%B %e, %Y'
SHORT_DATE_FORMAT = '%m/%d/%y'
SQL_DATE_FORMAT = '%Y-%m-%d'
SQL_TIME_FORMAT = "#{SQL_DATE_FORMAT} %H:%M:%S%z"
TIMESTAMP_FORMAT = "%Y%m%d_%H%M%S" # suitable for timestamps in paths
PRETTY_TIME_FORMAT = "#{SHORT_DATE_FORMAT} %l:%M %p"
SHORT_TIME_FORMAT = "%l:%M %p"

# Overrides

class Time

  def beginning_of_week(start_day = nil)
    # :monday is a ridiculous default
    super(start_day || :sunday)
  end

end

class Date

  def beginning_of_week(start_day = nil)
    # :monday is a ridiculous default
    super(start_day || :sunday)
  end

end