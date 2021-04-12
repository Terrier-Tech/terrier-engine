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

  s.add_dependency 'rails', '>= 4.2'
  s.add_dependency 'terminal-table'
  s.add_dependency 'parser'
  s.add_dependency 'elasticsearch'
  s.add_dependency 'spreadsheet'
  s.add_dependency 'nokogiri', '>= 1.10.4'
  s.add_dependency 'loofah', '>= 2.3.1'
  s.add_dependency 'awesome_print'

  s.add_development_dependency 'pg'
end
