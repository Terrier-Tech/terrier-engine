require 'csv'
require 'spreadsheet'
require 'xsv'
require 'xlsxtream'

module TabularIo

  ## Paths

  # uses some logic to convert a relative path to an absolute one:
  # - anything beginning with /system, /config, /db, /import, or /test will be relative to the app root
  # - any other path starting with / is assumed to be absolute
  # - everything else is relative to public/system/
  def self.rel_to_abs_path(rel_path)
    rel_path = rel_path.to_s
    if rel_path.index('/system') == 0
      Rails.root.join('public' + rel_path)
    elsif rel_path.index('/db') == 0 || rel_path.index('/test') == 0 || rel_path.index('/import') == 0 || rel_path.index('/config') == 0
      Rails.root.join(rel_path[1..-1])
    elsif rel_path[0] == '/'
      rel_path
    else
      Rails.root.join('public/system/' + rel_path)
    end
  end

  # returns the result of rel_to_abs_path but ensures that the directory exists
  def self.safe_rel_to_abs_path(rel_path)
    abs_path = self.rel_to_abs_path rel_path
    dir = File.dirname abs_path
    unless File.exist? dir
      FileUtils.mkdir_p dir
    end
    abs_path
  end

  # converts an absolute path to a relative one
  def self.abs_to_rel_path(abs_path)
    abs_path.to_s.gsub(Rails.root.join('public').to_s, '')
  end


  ## Loading

  # loads a csv or xlsx file in the given path (absolute or relative to project root)
  # and returns a hash with keys based on the first row
  def self.load(rel_path, options={})
    if rel_path.ends_with? '.xlsx'
      self.load_xlsx rel_path, options
    elsif rel_path.ends_with? '.csv'
      self.load_csv rel_path, options
    else
      raise "Don't know how to load file #{File.basename(rel_path)}"
    end
  end

  def self.load_csv(rel_path, options={})
    abs_path = self.rel_to_abs_path rel_path
    headers = nil
    data = []
    CSV.open(abs_path, 'r:bom|utf-8').each do |row|
      if headers
        record = {}
        row.each_with_index do |val, i|
          record[headers[i]] = val
        end
        data << record
      else
        headers = self.sanitize_csv_header row
      end
    end
    data
  end

  # TODO: remove this, bad name
  def self.parse(raw)
    self.parse_csv raw
  end

  # same as load_csv, but works on a raw string of csv instead of from a file
  def self.parse_csv(raw)
    headers = nil
    data = []
    CSV.parse(raw).each do |row|
      if headers
        record = {}
        row.each_with_index do |val, i|
          record[headers[i]] = val
        end
        data << record
      else
        headers = self.sanitize_csv_header row
      end
    end
    data
  end

  # parses a CSV header row to replace empty values with placeholders
  def self.sanitize_csv_header(row)
    row.map.with_index do |val, index|
      if val.present?
        val
      else
        "__#{index+1}__"
      end
    end
  end

  # loads an xlsx file into a hash of arrays of hashes
  def self.load_xlsx(rel_path, options = {})
    abs_path = self.rel_to_abs_path rel_path
    x = Xsv::Workbook.open(abs_path.to_s)
    output = {}
    sheets_to_import = options[:sheets]
    x.sheets.each do |sheet|
      # Offer the option to skip importing unneeded sheets. This significantly speeds up loading.
      next if sheets_to_import.present? && !sheets_to_import.include?(sheet.name)
      sheet.parse_headers!
      output[sheet.name] = sheet.to_a
    end
    output
  end


  ## Splitting

  # splits out the given file into separate csv files named based on the sheet names
  # optionally pass a different out_dir, defaults to the same directory as the input
  def self.split(rel_path, options={})
    sheets = self.load rel_path
    raise "#{rel_path} contains a single spreadsheet, nothing to split" if sheets.is_a? Array
    raise "#{rel_path} doesn't seem to contain a spreadsheet" unless sheets.is_a? Hash
    out_dir = options[:out_dir].presence || File.dirname(rel_path)
    sheets.each do |name, data|
      out_path = File.join out_dir, "#{name}.csv"
      self.save data, out_path
    end
    sheets
  end


  ## Columns

  # returns columns and their string versions (columns_s)
  def self.compute_columns(data, options)
    if (data.is_a?(Array) || data.is_a?(QueryResult)) && data.length > 0
      if options[:columns].is_a?(Array)
        columns = options[:columns]
      elsif options[:columns].is_a?(Hash)
        sheet_name = options[:sheet_name]
        columns = options[:columns][sheet_name]
      else
        columns = nil
      end

      columns = columns.presence || data.first.keys
    else
      columns = []
    end
    columns_s = columns.map(&:to_s)
    if options[:titleize_columns]
      columns_s = columns_s.map do |c|
        s = c.titleize
        if s =~ /Number$/
          s.gsub('Number', '#')
        else
          s
        end
      end
    end

    [columns, columns_s]
  end

  # you can't have these at the beginning of a cell value in Excel
  INVALID_PREFIXES = %w[= + -]

  # pulls the given column from the row, respecting the different
  # behavior of QueryResults
  def self.pluck_column(row, col)
    val = row.is_a?(QueryRow) ? row.send(col) : row[col]
    if val.nil?
      ''
    elsif val.is_a? Array
      val.map(&:to_s).join(',')
    else
      val
    end
  end

  # same as `pluck_column`, but protects against unsafe values in Excel
  def self.pluck_excel_safe_column(row, col)
    val = self.pluck_column row, col
    if val.try(:[], 0).in? INVALID_PREFIXES
      "`#{val}"
    else
      val
    end
  end


  ## Saving

  # TODO: remove this, bad name
  def self.write(data, options={})
    self.serialize_csv data, options
  end

  # converts an array of hashes to a csv string
  def self.serialize_csv(data, options={})
    return '' unless data && data.count > 0

    columns, columns_s = self.compute_columns data, options

    CSV.generate do |csv|
      csv << columns_s
      data.each do |row|
        csv << columns.map do |col|
          self.pluck_column row, col
        end
      end
    end
  end

  def self.save_csv(data, rel_path, options={})
    abs_path = self.safe_rel_to_abs_path rel_path
    # File.open abs_path, 'wt' do |f|
    #   f.write self.serialize_csv(data, options)
    # end

    columns, columns_s = self.compute_columns data, options

    CSV.open abs_path, 'w' do |csv|
      csv << columns_s
      data.each do |row|
        csv << columns.map do |col|
          self.pluck_column row, col
        end
      end
    end

    abs_path
  end

  # dumps data to a csv or xls file
  def self.save(data, rel_path, options={})
    if rel_path.ends_with? '.xls'
      self.save_xls data, rel_path, options
    elsif rel_path.ends_with? '.xlsx'
      self.save_xlsx data, rel_path, options
    elsif rel_path.ends_with? '.csv'
      self.save_csv data, rel_path, options
    else
      raise "Don't know how to save file #{File.basename(rel_path)}"
    end
  end

  # creates a sheet inside an xls workbook
  def self.create_sheet_xls(book, data, options)
    sheet = book.create_worksheet name: options[:sheet_name]

    columns, columns_s = self.compute_columns data, options

    sheet.row(0).concat columns_s
    r = 0
    data.each do |row|
      r += 1
      flat_row = columns.map do |col|
        self.pluck_column row, col
      end
      sheet.row(r).concat flat_row
    end
  end

  # columns should be an array of symbols
  # data should be an array of hashes
  # options can contain: columns, sheet_name, titleize_columns
  # returns the absolute path of the written file
  def self.save_xls(data, rel_path, options={})
    abs_path = self.safe_rel_to_abs_path rel_path
    options = {
        sheet_name: 'Data',
        titleize_columns: false
    }.merge options

    book = Spreadsheet::Workbook.new

    if data.is_a?(Hash)
      data.each do |sheet_name, _data|
        options[:sheet_name] = sheet_name.to_s
        self.create_sheet_xls book, _data, options
      end
    elsif data.is_a?(Array) || data.is_a?(QueryResult)
      self.create_sheet_xls book, data, options
    else
      raise "Don't know how to write a #{data.class.name} to xls"
    end

    book.write abs_path
    abs_path
  end

  # creates a sheet inside an xlsx workbook
  def self.create_sheet_xlsx(book, data, options)
    book.write_worksheet(name: options[:sheet_name], use_shared_strings: true) do |sheet|
      columns, columns_s = self.compute_columns data, options
      sheet << columns_s #Sheet header

      data.each do |row|
        sheet << columns.map { |col| self.pluck_excel_safe_column(row, col) }
      end
    end # Saves are performed on block close
  end
  
  # writes an xlsx file
  # data can be either an array of hashes or a hash of array of hashes
  def self.save_xlsx(data, rel_path, options={})
    abs_path = self.safe_rel_to_abs_path rel_path
    options = {
      sheet_name: 'Data',
      titleize_columns: false
    }.merge options

    Xlsxtream::Workbook.open(abs_path) do |book|
      if data.is_a?(Hash)
        data.each do |sheet_name, _data|
          options[:sheet_name] = sheet_name.to_s
          self.create_sheet_xlsx book, _data, options
        end
      elsif data.is_a?(Array) || data.is_a?(QueryResult)
        self.create_sheet_xlsx book, data, options
      else
        raise "Don't know how to write a #{data.class.name} to xlsx"
      end
    end  # Saves are performed on block close

    abs_path
  end



end

# for backwards compatability
CsvIo = TabularIo
