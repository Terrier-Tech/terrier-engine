
require 'coderay'

class QueryModel
  # @param attrs [Hash|String|ActionController::Parameters]
  def initialize(engine, attrs={})
    @engine = engine
    attrs = JSON.parse(attrs) if attrs.is_a?(String)
    attrs = attrs.to_unsafe_hash if attrs.is_a?(ActionController::Parameters)
    attrs.each do |k, v|
      raise "Unknown attribute '#{k}' for #{self.class.name}" unless self.respond_to? k
      self.send "#{k}=", v
    end
  end
end

# Base class for references to both from-tables and joined-tables
class TableRef < QueryModel
  # from the frontend
  attr_accessor :model, :prefix, :columns, :joins, :filters, :_id

  # used by the runner
  attr_accessor :table_name, :alias, :model_class

  # @param attrs [Hash]
  def initialize(engine, attrs)
    super

    # parse the collections
    if @columns.present?
      @columns = @columns.map{|col| ColumnRef.new(@engine, col)}
    else
      @columns = []
    end
    if @filters.present?
      @filters = @filters.map{|filter| Filter.new(@engine, filter)}
    else
      @filters = []
    end
  end

  # this needs to be called at the end of the subclass constructors since
  # it relies on things that aren't present in the TableRef constructor
  def init_joins
    if @joins.present?
      @joins = @joins.values.map { |join| JoinedTableRef.new(@engine, join, self) }
    else
      @joins = []
    end
  end

  # Recursively builds the query through the join tree.
  # Assumes #build_from or #build_join has already been called
  # @param builder [SqlBuilder]
  def build_recursive(builder, params={})
    # columns
    col_selects = (@columns || []).map do |col|
      col.to_select self, builder
    end
    if col_selects.present?
      builder.select col_selects
    end

    # filters
    if @filters.present?
      @filters.each do |filter|
        filter.build builder, self, params
      end
    end
    
    # joins
    @joins.each do |join|
      join.build_join builder, params
    end
  end

  # recursively adds column metadata to the given map
  def compute_column_metadata(columns)
    @columns.each do |col|
      metadata = col.compute_metadata self
      columns[metadata.select_name] = metadata if metadata
    end
    @joins.each do |join|
      join.compute_column_metadata columns
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

    init_joins
  end

  # Adds the from statement, then calls #build_recursive
  # @param builder [SqlBuilder]
  def build_from(builder, params = {})
    builder.from @table_name, @alias
    self.build_recursive builder, params
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

    init_joins
  end

  # Adds the join statement, then calls #build_recursive
  # @param builder [SqlBuilder]
  def build_join(builder, params={})
    type = @join_type.presence || 'left'
    raise "Invalid join type '#{type}'" unless %w[inner left].include?(type)
    fk = "#{@belongs_to}_id"
    builder.send "#{type}_join", @table_name, @alias, "#{@alias}.id = #{left_table.alias}.#{fk}"
    self.build_recursive builder, params
  end
end

# Represents just the metadata for the selected column,
# generated by ColumnRef#compute_metadata
class ColumnMetadata < QueryModel

  ATTRS = %i[select_name column_name type null]
  attr_accessor *ATTRS

  def as_json
    ATTRS.map{|a| [a, self.send(a)]}.to_h
  end
end

# Represents a single element of a select (and possibly group by) statement
class ColumnRef < QueryModel
  attr_accessor :name, :alias, :grouped, :function, :errors

  AGG_FUNCTIONS = %w[count sum average min max]
  
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
    a = @alias.presence || @name
    if table.prefix.present?
      a = [table.prefix, a].compact.join
    end
    "#{s} as \"#{a}\"" # always use the alias so that they're consistent and we can determine the resulting name when sorting
  end

  # @return [ColumnMetadata]
  def compute_metadata(table)
    metadata = ColumnMetadata.new @engine, {column_name: @name}

    # the full name of the selected column, including alias and table prefix
    metadata.select_name = [table.prefix.presence, @alias.presence || name].compact.join

    # the type
    model = table.model_class
    ar_column = model.columns_hash[@name]
    unless ar_column
      warn "Unknown column '#{@name}' for #{model.name}"
      return nil
    end
    sql_type_metadata = ar_column.sql_type_metadata
    metadata.null = ar_column.null
    metadata.type = model.custom_type(@name).presence || sql_type_metadata.type.to_s


    metadata
  end

end

class Filter < QueryModel
  attr_accessor :column, :column_type, :filter_type, :operator, :value, :numeric_value, :range, :in, :editable, :edit_label

  # this should match the implementation of `Filters.toInput` on the frontend
  def compute_input_key(table)
    key = "#{table.model}.#{@column}"
    case @filter_type
    when 'inclusion'
      "#{key}#in"
    when 'date_range'
      "#{key}#range"
    when 'direct'
      "#{key}##{@operator}"
    else
      raise "Don't know how to compute an input_key for a #{@filter_type} filter"
    end
  end

  def sql_operator
    case @operator
    when 'eq'
      '='
    when 'ne'
      '<>'
    when 'gt'
      '>'
    when 'lt'
      '<'
    when 'gte'
      '>='
    when 'lte'
      '<='
    when 'ilike'
      'ilike'
    else
      raise "Unknown operator '#{@operator}'"
    end
  end

  def build(builder, table, params={})
    # possibly override the value from the params
    input_key = compute_input_key table
    input_value = params[input_key]

    case @filter_type
    when 'direct'
      op = sql_operator
      val = input_value.presence || @value
      params[input_key] = val
      builder.where "#{table.alias}.#{@column} #{op} ?", val
    when 'date_range'
      period = DatePeriod.parse(input_value.presence || @range)
      params[input_key] = period.to_s
      builder.where "#{table.alias}.#{@column} >= ?", period.start_date
      builder.where "#{table.alias}.#{@column} < ?", period.end_date
    when 'inclusion'
      val = input_value.presence || @in
      val = val.split(',').map(&:strip) if val.is_a?(String)
      params[input_key] = val.join(', ')
      builder.where "#{table.alias}.#{@column} in ?", val
    else
      raise "Unknown filter type '#{@filter_type}'"
    end
  end
end

class Query < QueryModel

  attr_accessor :id, :name, :from, :columns, :order_by, :notes

  def initialize(engine, attrs)
    super

    @from = FromTableRef.new engine, @from
  end

end

class DataDive::QueryEngine
  include Loggable

  attr_reader :query

  def initialize(raw_query)
    @alias_counts = {}
    @query = Query.new self, raw_query
    @from = @query.from
  end

  def execute!(params={})
    builder = self.to_sql_builder params
    if builder.selects.empty?
      return {rows: [], columns: []}
    end
    rows = builder.exec
    {
      rows: rows,
      columns: self.compute_column_metadata.values.map(&:as_json)
    }
  end

  # Re-orders the builder's select statements to match the query's _columns_ array
  # @param builder [SqlBuilder]
  def apply_column_sort(builder)
    return false unless @query.columns.present?
    col_orders = {}
    @query.columns.each_with_index{|c, i| col_orders[c] = i}
    builder.selects = builder.selects.map do |s|
      name = s.gsub(/"$/, '').split('"').last
      index = col_orders[name]
      next unless index
      {select: s, name: name, index: index}
    end.compact.sort_by_key(:index).map_key :select
  end

  def to_sql_builder(params={})
    builder = SqlBuilder.new.as_raw
    if params[:limit].present?
      builder.limit params[:limit].to_i
    end
    @from.build_from builder, params
    apply_column_sort builder
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

  def compute_column_metadata
    columns = {}
    @from.compute_column_metadata columns
    columns
  end


  def validate
    sql = self.to_sql

    # add some line breaks to make it more readable
    %w[FROM WHERE LIMIT].each do |word|
      # don't indent these top-level keywords
      sql.gsub!(word, "\n #{word}")
    end
    %w[AND INNER LEFT].each do |word|
      # do indent these sub-keywords
      sql.gsub!(word, "\n   #{word}")
    end

    info "Generated SQL:\n#{sql}"
    res = {
      sql: sql,
      sql_html: CodeRay.scan(sql, :sql).html
    }
    self.class.validate_raw_sql sql, res
    res
  end

  def self.validate_raw_sql(sql, res={})
    explain = ActiveRecord::Base.connection.explain sql
    res[:explain] = explain
    res
  rescue => ex
    res[:error] = ex.message
    Rails.logger.warn "Error explaining query:\n#{sql}"
    res[:error_html] = CodeRay.scan(sql, :sql).html
    res
  end

end