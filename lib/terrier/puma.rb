module Terrier
  module Puma

    def self.load(dsl)
      path = File.join File.dirname(__FILE__), 'puma/config.rb'
      puts "Loading terrier-engine puma config from #{path}"
      dsl._load_from path
      path
    end

  end
end