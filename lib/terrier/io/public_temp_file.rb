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

end