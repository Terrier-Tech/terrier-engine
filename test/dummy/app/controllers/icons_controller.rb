class IconsController < ApplicationController

  def glyps
    count = GLYPS.count
    @title = "#{count} Glyps"
  end

  def hub
    @title = 'Hub Icons'
  end

  def badges
    @title = 'Badges'
  end

end