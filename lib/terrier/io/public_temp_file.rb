# helper for dealing with files that live (temporarily) in public/tmp
class PublicTempFile

  attr_reader :name, :abs_path, :rel_path

  def initialize(name)
    if name.index '/'
      raise "PublicTempFile names should not contain directories!"
    end
    @name = name
    @rel_path = "/tmp/#{name}"
    @abs_path = Rails.root.join("public#{rel_path}")
    abs_dir = File.dirname @abs_path
    unless File.exist? abs_dir
      FileUtils.mkdir abs_dir
    end
  end

  def exists?
    File.exist? @abs_path
  end

  # copies the contents from a Ruby TempFile
  # @param temp_file [TempFile]
  def from_temp_file(temp_file)
    File.open(self.abs_path, "wb") do |f|
      f.write(temp_file.read)
    end
  end

  # serializes the attributes to a hash
  def as_json
    h = {}
    %w[name abs_path rel_path].each {|f| h[f] = self.send(f)}
    h
  end

end