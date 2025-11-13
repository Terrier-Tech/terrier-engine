namespace :db_stats do

  desc 'Prints stats of all the tables'
  task print_tables: :environment do
    DbStats.print_tables
  end

  desc "Prints metadata for the columns and indexes of the given table"
  task :print_table, [:table] => [:environment] do |_, args|
    table = args[:table].presence || raise("You must specify a table name")
    DbStats.print_columns table
    DbStats.print_indexes table
  end

end