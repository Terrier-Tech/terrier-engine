namespace :db do

  desc 'Puts the schema of each table as comments at the top of the model files'
  task comment_schema: :environment do
    Dir.glob(Rails.root.join('app/models/*.rb')).each do |path|
      next if path.index 'application_record'
      model = File.basename(path).split('.').first.classify.constantize
      puts "\n== #{model.name} =="
      lines = []

      if model.ancestors.include?ApplicationRecord
        indexes = ActiveRecord::Base.connection.indexes(model.table_name)
      else
        puts "-- Skipping, table not defined"
        next
      end

      # columns
      rows = []
      lines << 'Columns'
      model.columns.sort_by(&:name).each do |column|
        next if column.name == 'id' or column.name == '_state'
        md = column.sql_type_metadata
        type = md.sql_type.gsub('without time zone', '').strip
        extras = []
        extras << 'required' unless column.null
        index = indexes.select{|index| index.columns==[column.name]}.first
        extras << 'indexed' if index
        extras << "default: #{column.default}" if column.default
        rows << [column.name, type, extras.join(', ')]
      end
      lines += Terminal::Table.new(rows: rows).to_s.split("\n")

      # indexes
      rows = []
      indexes.each do |index|
        if index.columns.length > 1
          extras = []
          extras << 'unique' if index.unique
          rows << [index.columns.join(' + '), extras.join(', ')]
        end
      end
      unless rows.empty?
        lines << ''
        lines << 'Indexes'
        lines += Terminal::Table.new(rows: rows).to_s.split("\n")
      end

      # associations
      rows = []
      model.reflections.keys.sort.each do |name|
        ref = model.reflections[name]
        type = ref.class.name.index('BelongsTo') ? 'Belongs To' : 'Has Many'
        name = ref.name.to_s
        rows << [type, name, ref.class_name]
      end
      unless rows.empty?
        lines << ''
        lines << 'Associations'
        lines += Terminal::Table.new(rows: rows).to_s.split("\n")
      end

      # make a comment string
      puts lines.join("\n")

      # insert the comment into the model file
      source = File.read path
      source_lines = source.split("\n")
      line = source_lines.shift
      until line =~ /^class/
        if lines.empty?
          raise "WTF, reached the end of the file without a class definition!"
        end
        line = source_lines.shift
      end
      all_lines = lines.map{|line| "# #{line}"} + [line] + source_lines
      File.open(path, 'wt') do |f|
        f.write all_lines.join("\n")
      end

    end

  end

end