# some general helper functions for calculating and printing database stats
module DbStats
  include ActionView::Helpers::NumberHelper

  def self.raw_exec(sql)
    ActiveRecord::Base.connection.execute(sql).to_a
  end

  TABLE_QUERY = <<SQL
SELECT
  relname AS "Table",
  pg_size_pretty(pg_table_size(relid)) AS "Data",
  pg_table_size(relid) as raw_data,
  pg_size_pretty(pg_indexes_size(relid)) AS "Indexes",
  pg_indexes_size(relid) as raw_indexes,
  pg_size_pretty(pg_total_relation_size(relid)) AS "Total",
  pg_total_relation_size(relid) as raw_total
FROM
  pg_catalog.pg_statio_user_tables 
ORDER BY pg_total_relation_size(relid) DESC;
SQL

  def self.tables
    raw_exec TABLE_QUERY
  end

  # collects database stats and returns them in a nice structure
  def self.print_tables
    table_data = self.tables
    puts "\n#{table_data.count.bold} tables"

    raw_data = []
    display_keys = %w[Table Data Indexes Total]
    raw_data << display_keys
    raw_data << :separator
    totals = {
      'Table' => 'Total',
      'raw_data' => 0,
      'raw_indexes' => 0,
      'raw_total' => 0
    }

    table_data.each do |row|
      raw_data << row.keys.map do |key|
        val = row[key]
        unless key == 'Table' || key.starts_with?('raw')
          val = val.rjust(10, ' ')
        end
        if key.starts_with? 'raw'
          totals[key] += val.to_i
          nil
        else
          val
        end
      end.compact
    end

    # totals row
    raw_data << :separator
    raw_data << totals.keys.map do |key|
      val = totals[key]
      if val.is_a? Integer
        totals[key].to_human_size.rjust(10, ' ')
      else
        totals[key]
      end
    end

    puts Terminal::Table.new rows: raw_data
  end


  def self.columns_query(table)
<<SQL
select * from information_schema.columns where table_name = '#{table}'
  order by column_name
SQL
  end

  # @return raw column metadata for the given table
  # @param [String]
  def self.columns(table)
    raw_exec columns_query(table)
  end

  # Computes and prints the disk space used by each column of the given table
  def self.print_columns(table)
    # get the metadata for all columns of the table
    column_data = columns table
    puts "\n#{column_data.count.bold} columns in #{table.blue}"

    total = 0
    table_data = [
      %w[Column Type Nullable Size],
      :separator
    ]

    # compute the size of each
    column_data.each do |column|
      column_name = column['column_name']
      column['size'] = raw_exec("SELECT sum(pg_column_size(#{column_name})) as size FROM #{table}").first['size'] || 0
      total += column['size']
    end

    # sort the raw data by size
    column_data.sort_by_key('size').reverse.map do |row|
      table_data << [
        row['column_name'],
        row['data_type'],
        row['is_nullable'],
        row['size'].to_human_size.rjust(10, ' '),
      ]
    end

    # totals row
    table_data << :separator
    table_data << [
      'Total',
      '',
      '',
      total.to_human_size.rjust(10, ' ')
    ]

    puts Terminal::Table.new rows: table_data
  end


  def self.indexes_query(table)
    <<SQL
SELECT i.relname                               AS name,
       a.attname                               AS column,
       am.amname                               AS type,
       ix.indisprimary                         AS primary,
       ix.indisunique                          AS unique,
       pg_relation_size(i.oid)                 AS raw
FROM pg_index ix
         JOIN pg_class i ON i.oid = ix.indexrelid
         JOIN pg_class t ON t.oid = ix.indrelid
         JOIN pg_namespace n ON n.oid = t.relnamespace
         JOIN pg_am am ON am.oid = i.relam
         LEFT JOIN pg_attribute a ON a.attrelid = t.oid
    AND a.attnum = ANY (ix.indkey)
WHERE t.relname = '#{table}'
ORDER BY pg_relation_size(i.oid) desc
SQL
  end

  # @return raw index metadata for the given table
  # @param [String]
  def self.indexes(table)
    raw_exec indexes_query(table)
  end

  def self.print_indexes(table)
    index_data = indexes table
    puts "\n#{index_data.count.bold} indexes in #{table.blue}"

    keys = index_data.first.keys - ['raw']

    table_data = [
      keys.map(&:titleize) + %w[Size],
      :separator
    ]

    total = index_data.map_key('raw').map(&:to_i).sum

    table_data += index_data.map do |row|
      keys.map{|col| row[col]} + [row['raw'].to_i.to_human_size.rjust(10, ' ')]
    end

    table_data << :separator
    table_data << ['Total'] + ['']*(keys.count-1) + [total.to_human_size.rjust(10, ' ')]

    puts Terminal::Table.new rows: table_data
  end

end