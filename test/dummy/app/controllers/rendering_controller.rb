class RenderingController < ApplicationController
  include Terrier::RenderingBase

  def exception
    begin
      raise "This is a test exception"
    rescue => ex
      render_exception ex, full: true
    end
  end

end