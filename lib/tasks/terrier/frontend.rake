require 'terrier/frontend/model_generator'

namespace :frontend do

  desc "Generate model files"
  task gen_models: :environment do
    ModelGenerator.new.run
  end

end