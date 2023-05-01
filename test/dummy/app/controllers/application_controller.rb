class ApplicationController < ActionController::Base
  include Terrier::RenderingBase
  include Loggable

  def page_title
    @title || self.class.name.gsub('Controller', '').titleize
  end

  def home
    @title = "Home"
  end

  def terrier_authenticate
    # no authentication in dummy app
  end

  def terrier_change_user
    'dummy'
  end

end
