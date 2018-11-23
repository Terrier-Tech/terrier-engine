require 'csv'

module CsvIo

  # uses some logic to convert a relative path to an absolute one:
  # - anything beginning with /system will be put in the app's system directory
  # - anything beginning with /db will be converted to the app's db directory
  # - anything beginning with /test will be converted to the app's test directory
  # - any other path starting with / is assumed to be absolute
  # - everything else is relative to public/system/
  def self.rel_to_abs_path(rel_path)
    if rel_path.index('/system') == 0
      Rails.root.join('public' + rel_path)
    elsif rel_path.index('/db') == 0 || rel_path.index('/test') == 0
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
  def self.load(rel_path)
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
        headers = row
      end
    end
    data
  end

  # same as load_csv, but works on a raw string of csv instead of from a file
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

  # converts an array of hashes to a csv string
  def self.write(data)
    return '' unless data && data.count > 0
    fields = data.first.keys
    CSV.generate do |csv|
      csv << fields
      data.each do |row|
        csv << fields.map{|f| row[f]}
      end
    end
  end

  # dumps data to a csv file
  def self.save(data, rel_path)
    abs_path = CsvIo.rel_to_abs_path rel_path
    dir = File.dirname abs_path
    unless File.exists? dir
      Dir.mkdir dir
    end
    File.open abs_path, 'wt' do |f|
      f.write CsvIo.write(data)
    end
    abs_path
  end


end