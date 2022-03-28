class ClientSideController < ApplicationController

  def modals
    @title = 'Modals'
  end

  def replaced_content
    @title = 'Replaced Content'
    render plain: "<h2 class='text-center'>Replaced Server-Side!</h2>", layout: false
  end

  def urls
    @title = 'URLs'
  end

  def versions
    @title = 'Versions'
  end

  def logging
    @title = 'Logging'
  end

end