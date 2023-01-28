

class TopController < ApplicationController

  def index
    begin
      @top = Top.compute
      render_success '', @top
    rescue => ex
      render_exception ex
    end
  end

end