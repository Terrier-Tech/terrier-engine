class FrontendController < ApplicationController
  include ActionController::Live

  def platform_demo
    @title = "Platform Demo"
    @entrypoint = 'platform-demo'
  end

  def streaming
    stream_response do |stream|
      20.times do |i|
        stream.info "Step #{i}"
        stream.write 'foo', {foo: i, time: Time.now}
        sleep 0.1
      end
    end
  end

end