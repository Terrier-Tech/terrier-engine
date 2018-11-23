$:.push File.expand_path('lib', __dir__)

# Maintain your gem's version:
require 'plunketts/engine/version'

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
  s.name        = 'plunketts-engine'
  s.version     = Plunketts::Engine::VERSION
  s.authors     = ['Andy Selvig']
  s.email       = ['andy@Flame.local']
  s.homepage    = 'plunketts.net'
  s.summary     = "Common code for Plunkett's Pest Control Rails applications"
  s.description = ''
  s.license     = 'MIT'

  s.files = Dir['{app,config,db,lib}/**/*', 'MIT-LICENSE', 'Rakefile', 'README.md']

  s.add_dependency 'rails', '~> 5.2.1'
  s.add_dependency 'terminal-table'

  s.add_development_dependency 'pg'
end
