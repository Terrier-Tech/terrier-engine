$:.push File.expand_path('lib', __dir__)

# Maintain your gem's version:
require 'terrier/version'

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name        = 'terrier-engine'
  s.version     = Terrier::VERSION
  s.authors     = ['Andy Selvig']
  s.email       = ['andy@terrier.tech']
  s.homepage    = 'https://terrier.tech'
  s.summary     = "Common code for Terrier Technologies Rails applications"
  s.description = ''
  s.license     = 'MIT'

  s.files = Dir['{app,config,db,lib,vendor}/**/*', 'MIT-LICENSE', 'Rakefile', 'README.md']

  s.add_dependency 'rails', '>= 5.2'
  s.add_dependency 'terminal-table'
  s.add_dependency 'parser'
  s.add_dependency 'spreadsheet'
  s.add_dependency 'xsv'
  s.add_dependency 'write_xlsx'
  s.add_dependency 'nokogiri', '>= 1.10.4'
  s.add_dependency 'loofah', '>= 2.3.1'
  s.add_dependency 'awesome_print'
  s.add_dependency 'puma'
  s.add_dependency 'puma-daemon'
  s.add_dependency 'sys-proctable'
  s.add_dependency 'dotenv'

  s.add_development_dependency 'pg'
  s.add_development_dependency 'sassc', '>= 2.4.0'
  s.add_development_dependency 'sassc-rails'
  s.add_development_dependency 'slim-rails'
  s.add_development_dependency 'jquery-rails'
  s.add_development_dependency 'turbolinks', '~> 5'
  s.add_development_dependency 'lodash-rails'
  s.add_development_dependency 'coffee-rails', '~> 4.2'
  s.add_development_dependency 'paperclip'
  s.add_development_dependency 'rack', '2.2.4'
end
