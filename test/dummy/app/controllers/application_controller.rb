DUMMY_USER_ATTRS = {
  email: 'terry@terrier.tech',
  first_name: "Terry",
  last_name: "Terrier",
  extern_id: 'terry',
  role: 'office',
  password: 'password',
  password_confirmation: 'password',
  created_by_name: 'system'
}

class ApplicationController < ActionController::Base
  include Terrier::RenderingBase
  include Loggable

  def page_title
    @title || self.class.name.gsub('Controller', '').titleize
  end

  def home
    @title = "Home"
  end

  def terrier_layout
    'application'
  end

  def terrier_authenticate
    # no authentication in dummy app
  end

  def terrier_change_user
    # ensure there's always a dummy user
    user = User.where(extern_id: DUMMY_USER_ATTRS[:extern_id]).first
    unless user
      user = User.new(DUMMY_USER_ATTRS)
      user.save!
    end
    user.role = 'super'
    user
  end

end
