source 'https://rubygems.org'
git_source(:github) { |repo| "https://github.com/#{repo}.git" }

# Declare your gem's dependencies in terrier-engine.gemspec.
# Bundler will treat runtime dependencies like base dependencies, and
# development dependencies will be added by default to the :development group.
gemspec

# Declare any dependencies that are still in development here instead of in
# your gemspec. These might include edge Rails or gems from your path or
# Git. Remember to move these dependencies to your gemspec before releasing
# your gem to rubygems.org.

gem 'sql_builder', git: 'git@github.com:Terrier-Tech/sql_builder.git'
gem 'terrier_auth', github: 'Terrier-Tech/terrier_auth', branch: 'main'

group :development do
  gem 'pry'
  gem 'rubocop', require: false
end