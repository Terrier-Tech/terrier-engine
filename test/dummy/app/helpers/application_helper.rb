require 'vite_rails'

module ApplicationHelper
  include ViteRails::TagHelpers

  def random_string(len)
    (0...len).map { ('a'..'z').to_a[rand(26)] }.join
  end

end
