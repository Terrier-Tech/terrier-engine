class FrontendController < ApplicationController
  include ActionController::Live

  def platform_demo
    @title = "Platform Demo"
    @entrypoint = 'platform-demo'
  end

  def list_viewer_demo
    @title = "List Viewer Demo"
    @entrypoint = "list-viewer-demo"
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

  def time
    time = Time.now

    if rand < 0.3
      raise "Returning error at #{time.strftime('%A, %e %b %Y %H:%M:%S')}!"
    end

    # can return multiple events
    render_api_success events: [
      { _type: '_log', level: 'info', message: "Returning time result at #{time.strftime('%A, %e %b %Y %H:%M:%S')}" },
      { _type: '_result', time: time.iso8601 },
    ]

    # a normal api result works as well; this makes normal api endpoints compatible with the polling subscriber by default
    # render_api_success time: time.iso8601

    # or return a custom result
    # render_api_success _type: 'foo', message: "This is a foo event!"
  rescue => ex
    render_exception ex
  end

  def stream_time
    stream_response do |stream|
      loop do
        begin
          time = Time.now

          if rand < 0.3
            raise "Pushing error at #{time.strftime('%A, %e %b %Y %H:%M:%S')}!"
          end

          stream.info("Pushing time result at #{time.strftime('%A, %e %b %Y %H:%M:%S')}")
          stream.result(time: time.iso8601)

          # can also write custom events like with a normal streamer
          # stream.write 'foo', message: "This is a foo event!"
        rescue => ex
          stream.error(ex)
        end
        sleep 1
      end
    end
  end

end