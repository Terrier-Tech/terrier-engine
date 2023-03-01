class ApplicationRecord < ActiveRecord::Base
  self.abstract_class = true

  include Terrier::Fields

  def save_by_system?
    self.created_by_name = 'system'
    self.save
  end

  def save_by_system!
    self.created_by_name = 'system'
    self.save!
  end

  def save_by_user!(user='system')
    self.created_by_name = user
    self.save!
  end
end
