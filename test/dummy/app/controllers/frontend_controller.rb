class FrontendController < ApplicationController
  include ActionController::Live

  def platform_demo
    @title = "Platform Demo"
    @entrypoint = 'platform-demo'
  end

  def streaming
    ResponseStreamer.new(self).run do |stream|
      100.times do |i|
        stream.info "Step #{i}"
      end
    end
  end

end