require 'csv'
require 'spreadsheet'
require 'xsv'

module CsvIo

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

  # converts an absolute path to a relative one
  def self.abs_to_rel_path(abs_path)
    abs_path.to_s.gsub(Rails.root.join('public').to_s, '')
  end


  # loads a csv file in the given path (absolute or relative to project root)
  # and returns a hash with keys based on the first row
  def self.load(rel_path, options={})
    if rel_path.ends_with? '.xlsx'
      return CsvIo.load_xlsx rel_path, options
    end
    abs_path = CsvIo.rel_to_abs_path rel_path
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
        headers = row.map(&:strip)
      end
    end
    data
  end

  # same as load, but works on a raw string of csv instead of from a file
  def self.parse(raw)
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
        headers = row
      end
    end
    data
  end

  # loads an xlsx file into a hash of arrays of hashes
  def self.load_xlsx(rel_path, options = {})
    abs_path = CsvIo.rel_to_abs_path rel_path
    x = Xsv::Workbook.open(abs_path.to_s)
    output = {}
    x.sheets.each do |sheet|
      sheet.parse_headers!
      output[sheet.name] = sheet.to_a
    end
    output
  end

  # returns columns and their string versions (columns_s)
  def self.compute_columns(data, options)
    if (data.is_a?(Array) || data.is_a?(QueryResult)) && data.length > 0
      columns = options[:columns].presence || data.first.keys
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

  # converts an array of hashes to a csv string
  def self.write(data, options={})
    return '' unless data && data.count > 0

    columns, columns_s = self.compute_columns data, options

    CSV.generate do |csv|
      csv << columns_s
      data.each do |row|
        csv << columns.map do |col|
          CsvIo.pluck_column row, col
        end
      end
    end
  end

  # dumps data to a csv or xls file
  def self.save(data, rel_path, options={})
    if rel_path.ends_with? '.xls'
      return self.save_xls data, rel_path, options
    end
    abs_path = CsvIo.rel_to_abs_path rel_path
    dir = File.dirname abs_path
    unless File.exist? dir
      Dir.mkdir dir
    end
    File.open abs_path, 'wt' do |f|
      f.write CsvIo.write(data, options)
    end
    abs_path
  end


  def self.create_sheet(book, data, options)
    sheet = book.create_worksheet name: options[:sheet_name]

    columns, columns_s = self.compute_columns data, options

    sheet.row(0).concat columns_s
    r = 0
    data.each do |row|
      r += 1
      flat_row = columns.map do |col|
        CsvIo.pluck_column row, col
      end
      sheet.row(r).concat flat_row
    end
  end

  # columns should be an array of symbols
  # data should be an array of hashes
  # options can contain: columns, sheet_name, titleize_columns
  # returns the absolute path of the written file
  def self.save_xls(data, rel_path, options={})
    abs_path = CsvIo.rel_to_abs_path rel_path
    dir = File.dirname abs_path
    unless File.exist? dir
      Dir.mkdir dir
    end
    options = {
        sheet_name: 'Data',
        titleize_columns: false
    }.merge options

    book = Spreadsheet::Workbook.new

    if data.is_a?(Hash)
      data.each do |sheet_name, _data|
        options[:sheet_name] = sheet_name.to_s
        CsvIo.create_sheet book, _data, options
      end
    elsif data.is_a?(Array) || data.is_a?(QueryResult)
      CsvIo.create_sheet book, data, options
    else
      raise 'Unknown Data Type'
    end

    book.write abs_path
    abs_path
  end



end