require 'terrier/frontend/model_generator'
require 'terrier/icons/hub_icon_generator'

namespace :frontend do

  desc "Generate model files for the application"
  task gen_models: :environment do
    ModelGenerator.new(
      exclude_prefix: 'Dd',
      imports: {
        '../../terrier/attachments' => %w[Attachment],
      }
    ).run
  end

  desc "Generate model files for data-dive"
  task gen_dd_models: :environment do
    typescript_dir = Terrier::Engine.root.join('app/frontend/data-dive/gen').to_s
    ModelGenerator.new(
      typescript_dir: typescript_dir,
      imports: {
        '../queries/queries' => %w[Query],
        '../dd-user' => %w[DdUser],
        '../queries/filters' => %w[FilterInput],
        '../../terrier/attachments' => %w[Attachment],
        '../../terrier/schedules' => %w[RegularSchedule],
        '../plots/dive-plot-layouts' => %w[DivePlotLayout],
        '../plots/dive-plot-traces' => %w[DivePlotTrace],
      },
      prefix: 'Dd',
      type_map: {'User' => 'DdUser'}
    ).run
  end

  desc "Generates hub icons"
  task gen_hub_icons: :environment do
    root_dir = Terrier::Engine.root.join('app/frontend/terrier/images').to_s
    template_dir = Terrier::Engine.root.join('lib/templates').to_s
    typescript_dir = Terrier::Engine.root.join('app/frontend/terrier/gen').to_s
    ruby_dir = Terrier::Engine.root.join('config/initializers').to_s
    optimized_dir = "#{root_dir}/optimized"

    generator = HubIconGenerator.new(template_dir: template_dir,
                             typescript_dir: typescript_dir, ruby_dir: ruby_dir)
    generator.optimize_svgs "#{root_dir}/raw", optimized_dir
    generator.run optimized_dir, "#{root_dir}/icons"
  end

  desc "Generate the composite badge images"
  task gen_badges: :environment do
    root_dir = Terrier::Engine.root.join('app/frontend/terrier/images').to_s
    template_dir = Terrier::Engine.root.join('lib/templates').to_s
    typescript_dir = Terrier::Engine.root.join('app/frontend/terrier/gen').to_s
    ruby_dir = Terrier::Engine.root.join('config/initializers').to_s
    optimized_dir = "#{root_dir}/optimized"

    generator = BadgeGenerator.new(template_dir: template_dir, typescript_dir: typescript_dir, ruby_dir: ruby_dir)
    generator.optimize_svgs "#{root_dir}/raw", optimized_dir
    generator.run image_in_dir: optimized_dir,
                  image_out_dir: "#{root_dir}/badges"
  end

end