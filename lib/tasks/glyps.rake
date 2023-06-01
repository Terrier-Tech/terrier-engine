require 'colorize'

namespace :glyps do

  desc "Compiles the glyps using glyphs2font, view preview terrier-engine.test/icons/glyps"
  task compile: :environment do
    glyp_dir = 'app/assets/glyps'

    timestamp = Time.now.strftime '%Y%m%d%H%M%S'

    # glyphs2font needs a yaml configuration file
    # so we generate the configuration hash and serialize it to yaml
    config = {}

    # configuration for the fonts
    css_path = 'app/assets/stylesheets/terrier/glyps.css'
    html_path = 'test/dummy/app/views/icons/glyps.html'
    config['font'] = {
      'ttf' => 'app/assets/fonts/glyps.ttf',
      'woff' => 'app/assets/fonts/glyps.woff',
      'css' => css_path,
      'html' => html_path,
      'name' => 'glyp',
      'prefix' => 'glyp',
      'fixedwidth' => true,
      'height' => 1000,
      'descent' => 150, # this makes them line up nicer inline
      'normalize' => true,
      'center' => true,
      'round' => 10e12
    }

    # optimize the entire directory using SVGO into a temporary directory
    tmp_dir = 'tmp/glyp'
    abs_tmp_dir = tmp_dir
    if File.exist? tmp_dir
      FileUtils.rm_r Dir.glob("#{abs_tmp_dir}/*")
    else
      FileUtils.mkdir abs_tmp_dir
    end
    logged_exec "Optimizing SVGs", "npx svgo --config app/assets/glyps/glyp-svgo-config.cjs -f #{glyp_dir} -o #{abs_tmp_dir}"

    # define the actual svg glyphs
    count = 0
    base_code = 0xE003
    root_dir = Rails.root.to_s + '/'
    config['glyphs'] = Dir.glob("#{glyp_dir}/*.svg").sort.map do |path|
      name = File.basename(path, '.svg')
      next if name == 'glyps'
      count += 1
      {
        'glyph' => "#{tmp_dir}/#{name}.svg", # relative path
        'name' => name,
        'code' => base_code + count
      }
    end.compact
    puts "Collected #{count} glyphs"

    # write the configuration file
    out_path = "glyps.yaml" # keep the yaml file in the project root so that all paths can be relative
    puts "Writing config to #{out_path}"
    File.open(out_path, "w") do |file|
      file.write(config.to_yaml)
    end

    # generate the font files
    logged_exec "Generating fonts", "npx glyphs2font glyps.yaml"

    # rename the css to an scss file in order to use the font-path helper
    scss_path = css_path.gsub '.css', '.scss'
    puts "Moving #{css_path.bold} to #{scss_path.bold}..."
    FileUtils.mv css_path, scss_path

    # replace the relative font paths with the font-path helper
    puts "Replacing relative font paths with #{'font-path'.blue} in #{scss_path.bold}..."
    scss = File.read scss_path
    %w(woff ttf).each do |format|
      scss.gsub! "\"../../fonts/glyps.#{format}\"", "font-path('glyps.#{format}')"
    end
    File.write scss_path, scss

    # leave only the .sample of the html file, wrapped in a identifiable div
    html = File.read html_path
    doc = Nokogiri::HTML html
    sample = doc.at_css('.sample')
    sample.css('span').each do |span|
      span.inner_html = span.inner_html.gsub '_', '_<wbr/>' # allow breaking on underscores
    end
    File.write html_path, "<div class='glyps-preview'>#{sample.inner_html}</div>"

    # glyp_static_whitelist.txt contains a list of regular expressions for glyps that should be compiled to static svg
    # if we don't do this, the full compiled file is 1MB, which I currently deem too large
    whitelist = File.readlines('app/assets/glyps/glyp_static_whitelist.txt').map do |line|
      /#{line.strip}/
    end

    # create glyp-svg.js that contains all of the raw svg defined by the whitelist
    all_svg = config['glyphs'].map do |glyph|
      glyp = glyph['name']
      is_whitelisted = false
      whitelist.each do |regex|
        if glyp =~ regex
          is_whitelisted = true
          break
        end
      end
      next unless is_whitelisted
      raw = File.read glyph['glyph']
      "glypSvg.#{glyp} = '#{raw.strip}'"
    end.compact
    out_path = 'app/assets/javascripts/terrier/glyp-svg.js'
    all_raw = all_svg.join("\n")
    puts "Writing #{all_svg.count.to_s.bold} raw SVGs to #{out_path.blue} totalling #{(all_raw.size / 1024.0).round(1).to_s.bold}KB"
    all_raw = "// Generated at #{Time.now} by glyps:compile\nwindow.glypSvg = {}\n\n" + all_raw
    File.write out_path, all_raw

    # generate the _glyps.scss, glyps.rb, and _glyps.coffee definitions files that lets us reference specific glyps directly in styles, ruby, and coffeescript
    %w[
      app/assets/stylesheets/terrier/_glyps.scss
      app/assets/javascripts/terrier/_glyps.coffee
      lib/terrier/icons/glyps.rb
      app/frontend/terrier/glyps.ts
    ].each do |rel_path|
      out_path = rel_path
      file_name = File.basename rel_path
      puts "Generating #{file_name.bold} definitions file to #{out_path.blue}..."
      defs_output = eval_template file_name, binding
      File.write out_path, defs_output
    end

    puts 'Done!'
  end

  def logged_exec(message, cmd)
    puts "#{message}: #{cmd.bold}"
    system cmd, exception: true
  end

  def eval_template(name, bind)
    template = File.read "lib/templates/#{name}.erb"
    ERB.new(template, 0, "%<>").result bind
  end

  desc 'Prints some debug information about the svg icons and font files'
  task debug: :environment do
    glyp_dir = 'app/assets/glyps'

    Dir.glob("#{glyp_dir}/*.svg").sort.map do |path|
      File.open path do |f|
        svg = f.read
        info = svg.match /<svg[\W\w]+version/
        puts path
        puts info[0].gsub('version', '').gsub('<svg', '')
      end
    end
  end

end