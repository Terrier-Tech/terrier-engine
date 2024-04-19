# base for classes that generate code and/or images
class BaseGenerator
  include Loggable

  # @option typescript_dir [String?] the output directory for typescript files
  # @option ruby_dir [String?] the output directory for ruby files
  # @option template_dir [String?] the directory for templates that aren't absolute paths
  def initialize(options={})
    @typescript_dir = options[:typescript_dir].presence || Rails.root.join("app/frontend/gen").to_s
    @ruby_dir = options[:ruby_dir].presence || Rails.root.join("config/initializers").to_s
    @template_dirs = ["#{Terrier::Engine.root}/lib/terrier/frontend"]
    if options[:template_dir].present?
      @template_dirs.unshift options[:template_dir]
    end
  end

  # render the named template in lib/templates using the given context
  # @param name [String] can be either the full path to a template or the name of a template in terrier/frontend
  # @param context [Binding] the binding context which which to render the ERB template
  def render_template(name, context)
    # read the template
    name = name.to_s # in case it's a Pathname
    template_name = name
    template_name += '.erb' unless template_name.end_with?('.erb')
    if name.start_with? '/'
      template_path = name
      name = File.basename name
      raise "Could not find template at #{template_path}" unless File.exist?(template_path)
    else
      template_path = nil
      @template_dirs.each do |dir|
        path = "#{dir}/#{template_name}"
        if File.exist?(path)
          template_path = path
          break
        end
      end
      raise "Could not find template named #{template_name}, looked in #{@template_dirs.to_sentence}" unless template_path.present?
    end
    template = ERB.new File.read(template_path), trim_mode: '%-'

    # determine the output path
    case name.split('.').last
    when 'ts'
      abs_path = "#{@typescript_dir}/#{name}"
      comment_prefix = '//'
    when 'rb'
      abs_path = "#{@ruby_dir}/#{name}"
      comment_prefix = '#'
    else
      raise "Don't know how to handle template #{name}"
    end
    abs_dir = File.dirname abs_path
    unless File.exist?(abs_dir)
      info "Creating output directory #{abs_dir.bold}"
      FileUtils.mkdir_p abs_dir
    end

    # render the template
    info "Rendering template #{name.bold} to #{abs_path.blue}"
    File.open abs_path, 'wt' do |f|
      raw = template.result context
      lines = raw.split("\n")[1..-1] # remove the noinspection line at the top
      lines.prepend "#{comment_prefix} This file was automatically generated on #{Time.now}, DO NOT EDIT IT MANUALLY!"
      f.write lines.join("\n")
    end
    abs_path
  end

  # Uses Prettier to format a file
  # @param path [String] the absolute path to the file
  def prettier_file(path)
    cmd = "npx --no-install prettier --print-width 200 --write --no-semi #{path}"
    info "Formatting file with #{cmd.bold}"
    system cmd
  end

  def svgo_path
    Terrier::Engine.root.join('node_modules/svgo/bin/svgo')
  end

  # optimize all SVG files in in_dir using SVGO
  def optimize_svgs(in_dir, out_dir)
    info "Optimizing images in #{in_dir.green} and storing them in #{out_dir.blue}"
    clear_directory out_dir
    system "#{svgo_path} -f #{in_dir} --config #{Terrier::Engine.root.join('lib/terrier/icons/svgo-config.cjs')} -o #{out_dir}", exception: true
  end

  # ensures that the directory exists and is empty
  def clear_directory(dir)
    info "Clearing directory #{dir.yellow}"
    Dir.mkdir dir unless File.exist? dir
    FileUtils.rm_rf Dir.glob("#{dir}/*")
  end

  # combine the contents of two or more SVG files
  # @param in_paths [Array<String>] the paths of the files to combine
  # @param out_path [String] the path of the combined file
  def combine_svgs(in_paths, out_path)
    info "Combining #{in_paths.join(" & ").italic} into #{out_path.blue}"
    count = 0
    in_docs = in_paths.map do |path|
      count += 1
      namespace = path.scan(/(\w+).svg/)[0].first + count.to_s
      Nokogiri::XML namespace_svg_ids(File.read(path), namespace)
    end
    out_doc = in_docs.first.dup
    out_content = out_doc.at_css('svg')
    in_docs[1..-1].each do |in_doc|
      content = in_doc.at_css('svg')
      content.children.each do |child|
        out_content << child
      end
    end
    File.open out_path, 'wt' do |out_file|
      out_file << out_doc.to_xml
    end
  end

  # appends a namespace to all ids in the raw svg string
  # @param svg [String]
  # @return [String]
  def namespace_svg_ids(svg, namespace)
    svg.scan(/id="(\w+)"/).each do |m|
      id = m.first
      svg.gsub!("id=\"#{id}\"", "id=\"#{id}#{namespace}\"")
      svg.gsub!("##{id}", "##{id}#{namespace}")
    end
    svg
  end

end