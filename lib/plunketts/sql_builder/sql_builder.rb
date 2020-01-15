require_relative './query_result'

# provides a builder interface for creating SQL queries
class SqlBuilder

  ATTRS = %w(selects clauses distincts froms joins order_bys group_bys havings withs dialect offset fetch)

  attr_accessor *ATTRS

  attr_accessor :the_limit, :make_objects

  @@default_make_objects = true

  def self.default_make_objects=(val)
    @@default_make_objects = val
  end

  def initialize
    ATTRS.each do |attr|
      self.send "#{attr}=", []
    end
    @make_objects = @@default_make_objects
    @the_limit = 10000
    @dialect = :psql
  end


  ## Dialects

  DIALECTS = %i(psql mssql)

  def dialect(new_dialect=nil)
    if new_dialect.nil?
      return @dialect # make this method act like a getter as well
    end
    new_dialect = new_dialect.to_sym
    unless DIALECTS.index new_dialect
      raise "Invalid dialect #{new_dialect}, must be one of: #{DIALECTS.join(', ')}"
    end
    @dialect = new_dialect
    self
  end

  def from(table, as=nil)
    if as
      @froms << "#{table} as #{as}"
    else
      @froms << table
    end
    self
  end

  def select(columns, table=nil, prefix=nil)
    columns = [columns] unless columns.is_a? Array
    table_part = table ? "#{table}." : ''
    columns.each do |c|
      statement = "#{table_part}#{c}"
      if prefix
        statement += " #{prefix}#{c}"
      end
      @selects << statement
    end
    self
  end

  def with(w)
    @withs << w
    self
  end

  def left_join(table, as, clause)
    @joins << "LEFT JOIN #{table} AS #{as} ON #{clause}"
    self
  end

  def inner_join(table, as, clause)
    @joins << "INNER JOIN #{table} AS #{as} ON #{clause}"
    self
  end

  def outer_join(table, as, clause)
    @joins << "LEFT OUTER JOIN #{table} AS #{as} ON #{clause}"
    self
  end

  def right_join(table, as, clause)
    @joins << "RIGHT JOIN #{table} AS #{as} ON #{clause}"
    self
  end

  def where(clause)
    @clauses << clause
    self
  end

  def having(clause)
    @havings << clause
    self
  end

  def group_by(expression)
    @group_bys << expression
    self
  end

  def order_by(expression)
    @order_bys << expression
    self
  end

  def limit(limit)
    @the_limit = limit
    self
  end

  def offset(offset)
    @offset = offset
  end

  def fetch(fetch)
    @fetch = fetch
  end

  def distinct(distinct, table=nil)
    distinct = [distinct] unless distinct.is_a? Array
    table_part = table ? "#{table}." : ''
    distinct.each do |d|
      statement = "#{table_part}#{d}"
      @distincts << statement
    end
    self
  end

  def to_sql
    _distinct = ''
    if @distincts and @distincts.count > 0
      if @dialect == :mssql
        _distinct += 'DISTINCT ('
        _distinct += @distincts.join(', ')
        _distinct += ')'
      else
        _distinct += 'DISTINCT ON ('
        _distinct += @distincts.join(', ')
        _distinct += ')'
      end
    end

    withs_s = @withs.map do |w|
      "WITH #{w}"
    end.join(' ')

    top_s = if @the_limit && @dialect == :mssql
      "TOP #{@the_limit}"
    else
      ''
    end

    s = "#{withs_s} SELECT #{top_s} #{_distinct} #{@selects.join(', ')} FROM #{@froms.join(', ')} #{@joins.join(' ')}"
    if @clauses.length > 0
      clauses_s = @clauses.map{|c| "(#{c})"}.join(' AND ')
      s += "  WHERE #{clauses_s}"
    end
    if @group_bys.length > 0
      s += " GROUP BY #{@group_bys.join(', ')}"
    end
    if @havings.length > 0
      s += " HAVING #{@havings.join(' AND ')}"
    end
    if @order_bys.length > 0
      s += " ORDER BY #{@order_bys.join(', ')}"
    end
    if @the_limit && @dialect != :mssql
      s += " LIMIT #{@the_limit}"
    end
    if @offset
      if @dialect == :psql
        s += " OFFSET #{@offset}"
      elsif @dialect == :mssql
        s += " OFFSET #{@offset} ROWS"
      end
    end
    if @fetch
      if @dialect == :psql
        s += " FETCH FIRST #{@fetch} ROWS ONLY"
      elsif @dialect == :mssql
        s += " FETCH NEXT #{@fetch} ROWS ONLY"
      end
    end
    s
  end

  def exec
    results = ActiveRecord::Base.connection.execute(self.to_sql).to_a
    if @make_objects
      QueryResult.new results
    else
      results
    end
  end

  def dup
    other = SqlBuilder.new
    ATTRS.each do |attr|
      other.send "#{attr}=", self.send(attr).dup
    end
    other.make_objects = @make_objects
    other.the_limit = @the_limit
    other
  end

  def as_raw
    @make_objects = false
    self
  end

  def as_objects
    @make_objects = true
    self
  end

  def self.from_raw(raw)
    builder = SqlBuilder.new
    ATTRS.each do |attr|
      if raw[attr]
        builder.send "#{attr}=", raw[attr]
      end
    end
    builder
  end


end
