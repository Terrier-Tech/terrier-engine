require_relative 'boot'

require 'rails/all'

# this is needed to make assets.rb load during tests
require "sprockets/railtie"

Bundler.require(*Rails.groups)
require "terrier/engine"

module Dummy
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 7.0

    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration can go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded after loading
    # the framework and any gems in your layout.

    # Force all access to the app over SSL, use Strict-Transport-Security, and use secure cookies.
    config.force_ssl = true

    config.autoload_paths << Terrier::Engine.root.join("lib/terrier")

    # custom error handling for all environments
    config.consider_all_requests_local = false
    config.exceptions_app = ->(env) { ErrorsController.action(:show).call(env) }
  end
end

