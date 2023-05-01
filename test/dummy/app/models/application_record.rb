class ApplicationRecord < ActiveRecord::Base
  self.abstract_class = true

  include Terrier::Model

  belongs_to :created_by, class_name: 'User', optional: true
  belongs_to :updated_by, class_name: 'User', optional: true

  def save_by_system?
    self.created_by_name = 'system'
    self.save
  end

  def save_by_system!
    self.created_by_name = 'system'
    self.save!
  end

  def save_by_user!(user='system')
    self.created_by_name ||= user
    self.updated_by_name = user
    self.save!
  end

  def save_if_needed!(change_user)
    return false unless self.changed?
    self.save_by_user! change_user
  end

end
