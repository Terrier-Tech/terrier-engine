require 'csv'
require 'spreadsheet'
require 'xsv'
require 'xlsxtream'

module TabularIo

  # the error that is thrown when the throw_error_on_blank_row parameter
  # is passed in, and a blank row is encountered in the file
  class BlankRowError < StandardError
  end

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

  # This class method loads a tabular file (CSV, TSV, XLS, or XLSX) from the given path
  # and returns a hash where the keys are derived from the first row of the file(s).
  #
  # @param rel_path [String] The relative or absolute path to the file to be loaded.
  # @param options [Hash] An optional hash for additional configurations.
  #   options[:output] - When set to :standardized, it ensures a consistent hash structure
  #                      for the output, irrespective of the input file format.
  #
  # @raise [RuntimeError] If the file type is unknown or unprocessable,
  #   the method raises an exception with a message indicating the issue.
  #
  # @example
  #   load('/path/to/file.xlsx', output: :standardized)
  #
  def self.load(rel_path, options={})
    # Determine the file type and delegate to the corresponding load method.
    data = case File.extname(rel_path)
           when '.xlsx' then self.load_xlsx(rel_path, options)
           when '.csv' then self.load_csv(rel_path, options)
           when '.tsv' then self.load_tsv(rel_path, options)
           when '.xls' then self.load_xls(rel_path, options)
           else raise "Don't know how to load file #{File.basename(rel_path)}"
           end

    # Standardize the output format if the option is specified.
    if options[:output] == :standardized
      data = case data
      when Hash then data # Excel with multiple sheets
      when Array
        if data.first.is_a?(String) # Excel with a single sheet
          {data.first => data.second}
        elsif data.first.is_a?(Hash) # Text file (CSV, TSV)
          {nil => data}
        else
          raise("Don't know how to parse output of #{rel_path}")
        end
      end
    end

    data
  end


  def self.load_csv(rel_path, options={})
    abs_path = self.rel_to_abs_path rel_path
    headers = nil
    data = []
    consecutive_blank_rows = 0
    n_blank_allowed = options.fetch(:n_blank_allowed, 0)
    throw_error_on_blank_row = options.fetch(:throw_error_on_blank_row, false)

    CSV.open(abs_path, 'r:bom|utf-8').each do |row|
      if row.compact.empty?
        # Increment blank row counter
        consecutive_blank_rows += 1
        # Throw error if the row is blank and throw_error_on_blank_row is true
        if throw_error_on_blank_row
          raise BlankRowError, "Blank row encountered in sheet"
        end
        # Break if exceeding allowed blank rows
        if consecutive_blank_rows > n_blank_allowed
          puts "Stopping processing after encountering #{consecutive_blank_rows} consecutive blank rows."
          break
        end
      else
        consecutive_blank_rows = 0  # Reset counter if row is not blank

        if headers
          record = {}
          row.each_with_index do |val, i|
            record[headers[i].to_s] = val
          end
          data << record
        else
          headers = self.sanitize_csv_header(row)
        end
      end
    end
    data
  end

  def self.load_tsv(rel_path, options={})
    abs_path = self.rel_to_abs_path rel_path
    headers = nil
    data = []
    consecutive_blank_rows = 0
    n_blank_allowed = options.fetch(:n_blank_allowed, 0)
    throw_error_on_blank_row = options.fetch(:throw_error_on_blank_row, false)

    CSV.open(abs_path, 'r:bom|utf-8', col_sep: "\t").each do |row|
      if row.compact.empty?
        # Increment blank row counter
        consecutive_blank_rows += 1
        # Throw error if the row is blank and throw_error_on_blank_row is true
        if throw_error_on_blank_row
          raise BlankRowError, "Blank row encountered in sheet"
        end
        # Break if exceeding allowed blank rows
        if consecutive_blank_rows > n_blank_allowed
          puts "Stopping processing after encountering #{consecutive_blank_rows} consecutive blank rows."
          break
        end
      else
        consecutive_blank_rows = 0

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
    end
    data
  end

  # TODO: remove this, bad name
  def self.parse(raw)
    self.parse_csv raw
  end

  # same as load_csv, but works on a raw string of csv instead of from a file
  def self.parse_csv(raw, options = {})
    n_blank_allowed = options.fetch(:n_blank_allowed, 0)
    headers = nil
    data = []
    consecutive_blank_rows = 0

    CSV.parse(raw).each do |row|
      if row.compact.empty?
        # Increment blank row counter
        consecutive_blank_rows += 1
        # Break if exceeding allowed blank rows
        if consecutive_blank_rows > n_blank_allowed
          puts "Stopping processing after encountering #{consecutive_blank_rows} consecutive blank rows."
          break
        end
      else
        consecutive_blank_rows = 0  # Reset counter if row is not blank

        if headers
          record = {}
          row.each_with_index do |val, i|
            record[headers[i].to_s] = val
          end
          data << record
        else
          headers = self.sanitize_csv_header(row)
        end
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
    n_blank_allowed = options.fetch(:n_blank_allowed, 0)
    throw_error_on_blank_row = options.fetch(:throw_error_on_blank_row, false)

    x.sheets.each do |sheet|
      next if sheets_to_import.present? && !sheets_to_import.include?(sheet.name)

      begin
        sheet.parse_headers!
      rescue Xsv::DuplicateHeaders => e
        puts "Error while processing headers for sheet #{sheet.name}: #{e.message}"
      end

      output[sheet.name] = []
      consecutive_blank_rows = 0

      sheet.each_row do |row|
        # Check if the row is blank
        if row.compact.empty?
          consecutive_blank_rows += 1
          # Throw error if the row is blank and throw_error_on_blank_row is true
          if throw_error_on_blank_row
            raise BlankRowError, "Blank row encountered in sheet #{sheet.name}."
          end
          # Log and break if the number of consecutive blank rows exceeds the limit
          if consecutive_blank_rows > n_blank_allowed
            puts "Stopping processing of sheet '#{sheet.name}' after encountering #{consecutive_blank_rows} consecutive blank rows."
            break
          end
        else
          consecutive_blank_rows = 0
          row_hash = {}
          sheet.headers.each do |header|
            row_hash[header.to_s] = row[header]
          end
          output[sheet.name] << row_hash
        end
      end
    end

    output
  end

  def self.load_xls(rel_path, options = {})
    abs_path = self.rel_to_abs_path(rel_path)
    book = Spreadsheet.open(abs_path)
    output = {}
    sheets_to_import = options[:sheets]
    n_blank_allowed = options.fetch(:n_blank_allowed, 0)
    throw_error_on_blank_row = options.fetch(:throw_error_on_blank_row, false)

    book.worksheets.each do |sheet|
      next if sheets_to_import.present? && !sheets_to_import.include?(sheet.name)

      headers = self.sanitize_csv_header(sheet.row(0))
      data = []
      consecutive_blank_rows = 0

      sheet.each(1) do |row|
        # Check if the row is blank
        if row.all?(&:nil?)
          consecutive_blank_rows += 1
          # Throw error if the row is blank and throw_error_on_blank_row is true
          if throw_error_on_blank_row
            raise BlankRowError, "Blank row encountered in sheet #{sheet.name}."
          end
          # Log and break if the number of consecutive blank rows exceeds the limit
          if consecutive_blank_rows > n_blank_allowed
            puts "Stopping processing of sheet '#{sheet.name}' after encountering #{consecutive_blank_rows} consecutive blank rows."
            break
          end
        else
          consecutive_blank_rows = 0
          record = {}
          row.each_with_index do |val, i|
            record[headers[i].to_s] = val
          end
          data << record
        end
      end

      output[sheet.name] = data
    end

    output
  end

  ##
  # Loads and returns headers from a file (CSV, TSV, XLS, XLSX).
  #
  # @param rel_path [String] The relative path to the file.
  # @return [Hash] Headers in a hash format: {sheet_name => [headers]} or {nil => []} for TSV/CSV or empty files.
  # @raise [RuntimeError] If the file format is unsupported.
  #
  def self.load_headers(rel_path)
    abs_path = self.rel_to_abs_path rel_path

    case File.extname(rel_path)
    when '.csv', '.tsv'
      # For CSV and TSV, attempt to read the first line and return it as headers
      separator = File.extname(rel_path) == '.csv' ? ',' : "\t"
      file = File.open(abs_path, 'r:bom|utf-8')

      begin
        headers = file.readline.chomp.split(separator)
      rescue EOFError
        headers = []
      ensure
        file.close
      end

      return {nil => headers}

    when '.xlsx'
      # For XLSX, iterate through each sheet and get the headers
      workbook = Xsv::Workbook.open(abs_path.to_s)
      headers = {}
      workbook.sheets.each do |sheet|
        begin
          sheet.parse_headers!
        rescue Xsv::DuplicateHeaders => e
          puts "Error while processing headers for sheet #{sheet.name}: #{e.message}"
        end
        headers[sheet.name] = sheet.headers
      end
      return headers

    when '.xls'
      # For XLS, iterate through each sheet and get the headers
      book = Spreadsheet.open abs_path
      headers = {}
      book.worksheets.each do |sheet|
        headers[sheet.name] = sheet.row(0).to_a
      end
      return headers

    else
      raise "Don't know how to load headers for file #{File.basename(rel_path)}"
    end
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

  def self.save_tsv(data, rel_path, options={})
    abs_path = self.safe_rel_to_abs_path rel_path
    columns, columns_s = self.compute_columns data, options

    CSV.open(abs_path, 'w', col_sep: "\t") do |csv|
      csv << columns_s
      data.each do |row|
        csv << columns.map { |col| self.pluck_column row, col }
      end
    end

    abs_path
  end

  # dumps data to a csv or xls file
  def self.save(data, rel_path, options={})
    if rel_path.ends_with? '.xlsx'
      self.save_xlsx data, rel_path, options
    elsif rel_path.ends_with? '.csv'
      self.save_csv data, rel_path, options
    elsif rel_path.ends_with? '.tsv'
      self.save_tsv data, rel_path, options
    elsif rel_path.ends_with? '.xls'
      self.save_xls data, rel_path, options
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
    sheet_name = options[:sheet_name]
    sheet_name = sheet_name.dup if sheet_name.frozen?
    sheet_name = sheet_name.force_encoding('UTF-8')

    book.write_worksheet(name: sheet_name, use_shared_strings: true) do |sheet|
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

    Xlsxtream::Workbook.open(abs_path.to_s.force_encoding('UTF-8')) do |book|
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

  ## Validation

  def self.accepts_exts
    ['.csv', '.tsv', '.xls', '.xlsx']
  end

  def self.valid_file_type?(rel_path)
    abs_path = self.rel_to_abs_path rel_path
    extension = File.extname(rel_path)

    begin
      case extension
      when '.csv', '.tsv'
        separator = extension == '.csv' ? ',' : "\t"

        # Check for null bytes to identify non-text files
        if File.read(abs_path).include?("\x00")
          return false
        end

        CSV.foreach(abs_path, headers: true, col_sep: separator)

      when '.xlsx'
        Xsv::Workbook.open(abs_path.to_s)

      when '.xls'
        Spreadsheet.open abs_path

      else
        raise "Unsupported file extension."
      end

    rescue Zip::Error
      return false

    rescue CSV::MalformedCSVError
      return false

    rescue Xsv::Error => e
      return false

    rescue Ole::Storage::FormatError
      return false

    rescue => e
      raise "An error occurred while validating the file: #{e.message}"
    end

    # If no exception was raised, the file type is likely correct.
    true
  end

  def self.file_empty?(rel_path)
    abs_path = self.rel_to_abs_path rel_path

    # Raise an error if the file is empty
    return true if File.zero?(abs_path)

    case File.extname(rel_path)
    when '.csv', '.tsv'
      separator = File.extname(rel_path) == '.csv' ? ',' : "\t"
      CSV.foreach(abs_path, col_sep: separator) do |row|
        # Check if any value in the row is not nil or not an empty string
        row=row.map{|cell|cell&.sub(/\A\uFEFF/, '')} # strip byte order mark
        unless row.all? { |cell| cell.nil? || cell.strip.empty? }
          return false
        end
      end
      # If we reach here, all rows are empty
      return true

    when '.xlsx', '.xls'
      # For Excel files, you can use existing methods to load the file
      # and check if any sheet contains data.
      data = self.load(rel_path)
      data.each do |sheet_name, rows|
        unless rows.empty?
          return false
        end
      end
      # If we reach here, all sheets are empty
      return true

    else
      raise "Unsupported file type at #{abs_path}"
    end
  end

end

# for backwards compatability
CsvIo = TabularIo
