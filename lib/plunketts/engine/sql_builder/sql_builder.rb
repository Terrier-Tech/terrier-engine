require_relative './query_result'

# provides a builder interface for creating SQL queries
class SqlBuilder

  ATTRS = %w(selects clauses distincts froms joins order_bys group_bys havings withs)

  def initialize
    ATTRS.each do |attr|
      self.send "#{attr}=", []
    end
    @make_objects = true
    @the_limit = 10000
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
      _distinct += 'DISTINCT ON ('
      _distinct += @distincts.join(', ')
      _distinct += ')'
    end

    withs_s = @withs.map do |w|
      "WITH #{w}"
    end.join(' ')

    s = "#{withs_s} SELECT #{_distinct} #{@selects.join(', ')} FROM #{@froms.join(', ')} #{@joins.join(' ')}"
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
    if @the_limit
      s += " LIMIT #{@the_limit}"
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

  protected

  attr_accessor *ATTRS

  attr_accessor :the_limit, :make_objects


end
