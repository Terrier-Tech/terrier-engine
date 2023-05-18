
class QueryModel
  # @param attrs [Hash]
  def initialize(engine, attrs={})
    @engine = engine
    attrs.each do |k, v|
      raise "Unknown attribute '#{k}' for #{self.class.name}" unless self.respond_to? k
      self.send "#{k}=", v
    end
  end
end

# Base class for references to both from-tables and joined-tables
class TableRef < QueryModel
  # from the frontend
  attr_accessor :model, :columns, :joins, :filters

  # used by the runner
  attr_accessor :table_name, :alias, :model_class

  # @param attrs [Hash]
  def initialize(engine, attrs)
    super

    # parse the collections
    if @columns.present?
      @columns = @columns.map{|col| ColumnRef.new(@engine, col)}
    end
    if @filters.present?
      @filters = @filters.map{|filter| Filter.new(@engine, filter)}
    end

  end

  # Recursively builds the query through the join tree.
  # Assumes #build_from or #build_join has already been called
  # @param builder [SqlBuilder]
  def build_recursive(builder)
    # columns
    col_selects = (@columns || []).map do |col|
      col.to_select self, builder
    end
    if col_selects.present?
      builder.select col_selects.join(', ')
    end

    # filters
    if @filters.present?
      @filters.each do |filter|
        filter.build builder, self
      end
    end
    
    # joins
    if @joins.present?
      @joins = @joins.map { |join| JoinedTableRef.new(@engine, join, self) }
      @joins.each do |join|
        join.build_join builder
      end
    end
  end
end

# Reference to a table that is the entry point for the query.
class FromTableRef < TableRef

  # @param attrs [Hash]
  def initialize(engine, attrs)
    super

    # get the model
    @model_class = @model.constantize
    @table_name = @model_class.table_name
    @alias = @engine.compute_alias @table_name.singularize
  end

  # Adds the from statement, then calls #build_recursive
  # @param builder [SqlBuilder]
  def build_from(builder)
    builder.from @table_name, @alias
    self.build_recursive builder
  end

end

# Reference to a table that's joined into the query.
class JoinedTableRef < TableRef
  attr_accessor :join_type, :belongs_to, :left_table

  # @param attrs [Hash]
  # @param left_table [TableRef]
  def initialize(engine, attrs, left_table)
    super engine, attrs
    @left_table = left_table

    raise "Missing belongs_to for JoinedTableRef" unless @belongs_to.present?

    # compute the model from the belongs_to
    ref = left_table.model_class.reflections[@belongs_to]
    raise "No belongs_to named '#{@belongs_to}' for #{left_table.model}" if ref.nil?
    @model = ref.options[:class_name] || @belongs_to.classify
    @model_class = @model.constantize
    @table_name = @model_class.table_name
    @alias = @engine.compute_alias @belongs_to
  end

  # Adds the join statement, then calls #build_recursive
  # @param builder [SqlBuilder]
  def build_join(builder)
    type = @join_type.presence || 'left'
    raise "Invalid join type '#{type}'" unless %w[inner left].include?(type)
    fk = "#{@belongs_to}_id"
    builder.send "#{type}_join", @table_name, @alias, "#{@alias}.id = #{left_table.alias}.#{fk}"
    self.build_recursive builder
  end
end

# Represents a single element of a select (and possibly group by) statement
class ColumnRef < QueryModel
  attr_accessor :name, :alias, :grouped, :function

  AGG_FUNCTIONS = %w[count min max]
  
  def to_select(table, builder)
    s = "#{table.alias}.#{name}"
    if @function.present?
      g = nil
      case @function
      when *AGG_FUNCTIONS
        # aggregate functions can be used directly
        s = "#{@function}(#{s})"
      when 'year'
        if @grouped
          g = "date_trunc('year',#{s})"
          s = "to_char(#{g},'YYYY')"
        else
          s = "to_char(#{s},'YYYY')"
        end
      when 'month'
        if @grouped
          g = "date_trunc('month',#{s})"
          s = "to_char(#{g},'YYYY-MM')"
        else
          s = "to_char(#{s},'YYYY-MM')"
        end
      when 'day'
        builder.group_by "date_trunc('day',#{s})" if @grouped
        s = "#{s}::date"
        g = s if @grouped
      else
        raise "Unknown select function '#{@function}'"
      end
      builder.group_by g if g.present?
    elsif @grouped # grouped but no function
      builder.group_by s
    end
    if @alias.present?
      s = "#{s} as #{@alias}"
    end
    s
  end
end

class Filter < QueryModel
  attr_accessor :column, :filter_type, :operator, :value, :range, :in, :editable, :edit_label

  def sql_operator
    case @operator
    when 'eq'
      '='
    when 'ne'
      '<>'
    when 'ilike'
      'ilike'
    else
      raise "Unknown operator '#{@operator}'"
    end
  end

  def build(builder, table)
    case @filter_type
    when 'direct'
      op = sql_operator
      builder.where "#{table.alias}.#{@column} #{op} ?", @value
    when 'date_range'
      period = DatePeriod.parse @range
      builder.where "#{table.alias}.#{@column} >= ?", period.start_date
      builder.where "#{table.alias}.#{@column} < ?", period.end_date
    when 'inclusion'
      builder.where "#{table.alias}.#{@column} in ?", @in
    else
      raise "Unknown filter type '#{@filter_type}'"
    end
  end
end

class QueryEngine
  include Loggable

  def initialize(query)
    query = OpenStruct.new(query) if query.is_a?(Hash)
    @query = query
    @alias_counts = {}
    @from = FromTableRef.new self, query.from
  end

  def execute!(params={})

  end

  def to_sql_builder(params={})
    builder = SqlBuilder.new
    @from.build_from builder
    builder
  end

  def to_sql(params={})
    self.to_sql_builder(params).to_sql
  end


  def compute_alias(prefix)
    prefix = 'u' if prefix == 'user' # ensure that the prefix isn't a reserved word
    @alias_counts[prefix] ||= 0
    (@alias_counts[prefix] == 0) ? suffix = '' : suffix = @alias_counts[prefix]
    @alias_counts[prefix] += 1
    "#{prefix}#{suffix}"
  end

end