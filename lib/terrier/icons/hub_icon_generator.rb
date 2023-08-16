require 'terrier/frontend/base_generator'

# generates colorized hub icons
class HubIconGenerator < BaseGenerator

  def run(in_dir, out_dir)
    clear_directory out_dir

    icon_defs = {}
    icon_names = []
    reaction_icon_names = []

    # colorize the icons
    icon_opacity = 0.33
    Dir.glob("#{in_dir}/icon-*.svg").each do |in_path|
      name = File.basename(in_path, '.svg').gsub(/^icon-/, '')
      icon_names << name
      reaction_types = %w[thumbs_up flex bug feature step_investigate] # TODO: make this shared with the hub `CommentReaction.possible_reaction_type_values`
      if reaction_types.include? name
        reaction_icon_names << name
      end
      raw = File.read in_path

      # ensure all transparent colors have the same opacity
      raw = raw.gsub(/fill-opacity="[\d.]+"/) do |match|
        "fill-opacity=\"#{icon_opacity}\""
      end

      colored = raw.gsub(/#000000|#000/, "currentColor")
      File.write("#{out_dir}/#{name}.svg", colored)
      icon_defs[name] = { name: name, file_name: name, var_name: name.camelcase }
    end

    # generate icons.ts
    out_path = render_template 'hub-icons.ts', binding
    info "Wrote #{icon_defs.count.to_s.bold} client-side icons to #{out_path.blue}"

    # generate hub_icons.rb
    icon_names_def = '%i[' + icon_names.join(' ') + ']'
    out_path = render_template 'hub_icons.rb', binding
    info "Wrote #{icon_names.count.to_s.bold} server-side icons to #{out_path.blue}"

    # copy the icons to app/assets/hub_icons
    icons_out_dir = Terrier::Engine.root.join("app/assets/hub_icons").to_s
    FileUtils.mkdir_p icons_out_dir unless File.exist? icons_out_dir
    icon_names.each do |name|
      from_path = Terrier::Engine.root.join("app/frontend/terrier/images/icons/#{name}.svg").to_s
      to_path = Terrier::Engine.root.join("app/assets/hub_icons/#{name}.svg").to_s
      info "Copying #{from_path.bold} to #{to_path.bold}"
      FileUtils.cp from_path, to_path
    end

    # copy some images to app/assets/images
    %w[terrier-hub-favicon-alert.png terrier-hub-favicon-dark.png terrier-hub-favicon.png terrier-hub-logo-dark.svg terrier-hub-logo-light.svg].each do |name|
      subdir = name.ends_with?('png') ? 'raw' : 'optimized'
      from_path = Terrier::Engine.root.join("app/frontend/terrier/images/#{subdir}/#{name}").to_s
      to_path = Terrier::Engine.root.join("app/assets/images/terrier/engine/#{name}").to_s
      info "Copying #{from_path.bold} to #{to_path.bold}"
      FileUtils.cp from_path, to_path
    end
  end

end