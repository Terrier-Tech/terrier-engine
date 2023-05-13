
class QueryModel
  # @param attrs [Hash]
  def initialize(attrs={})
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

  @counts = {}

  def self.compute_alias(prefix, table)
    # ensure that the prefix isn't a reserved word
    prefix = 'u' if prefix == 'user'

    @counts[table.model] ||= 0
    if @counts[table.model] == 0
      suffix = ''
    else
      suffix = @counts[table.model]
    end
    @counts[table.model] += 1
    "#{prefix}#{suffix}"
  end

  # @param attrs [Hash]
  def initialize(attrs)
    super

    # parse the collections
    if @columns.present?
      @columns = @columns.map{|col| ColumnRef.new(col)}
    end
    if @filters.present?
      @filters = @filters.map{|filter| Filter.new(filter)}
    end

  end

  # Recursively builds the query through the join tree.
  # Assumes #build_from or #build_join has already been called
  # @param builder [SqlBuilder]
  def build_recursive(builder)
    # columns
    col_selects = (@columns || []).map do |col|
      col.to_select self
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
      @joins = @joins.map { |join| JoinedTableRef.new(join, self) }
      @joins.each do |join|
        join.build_join builder
      end
    end
  end
end

# Reference to a table that is the entry point for the query.
class FromTableRef < TableRef

  # @param attrs [Hash]
  def initialize(attrs)
    super

    # get the model
    @model_class = @model.constantize
    @table_name = @model_class.table_name
    @alias = TableRef.compute_alias @table_name.singularize, self
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
  def initialize(attrs, left_table)
    super attrs
    @left_table = left_table

    raise "Missing belongs_to for JoinedTableRef" unless @belongs_to.present?

    # compute the model from the belongs_to
    ref = left_table.model_class.reflections[@belongs_to]
    raise "No belongs_to named '#{@belongs_to}' for #{left_table.model}" if ref.nil?
    @model = ref.options[:class_name] || @belongs_to.classify
    @model_class = @model.constantize
    @table_name = @model_class.table_name
    @alias = TableRef.compute_alias @belongs_to, self
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

class ColumnRef < QueryModel
  attr_accessor :name, :alias, :grouped, :function
  
  def to_select(table)
    s = "#{table.alias}.#{name}"
    if @function.present?
      s = "#{@function}(#{s})"
    end
    if @alias.present?
      s = "#{s} as #{@alias}"
    end
    s
  end
end

class Filter < QueryModel
  attr_accessor :column, :filter_type, :operator, :value, :min, :max, :in, :editable, :edit_label

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
      if @min
        builder.where "#{table.alias}.#{@column} >= ?", @min
      end
      if @max
        d = Date.parse(@max) + 1.day
        builder.where "#{table.alias}.#{@column} < ?", d
      end
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
    @from = FromTableRef.new query.from
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


end