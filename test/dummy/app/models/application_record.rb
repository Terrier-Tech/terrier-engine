class ApplicationRecord < ActiveRecord::Base
  self.abstract_class = true

  include Plunketts::Fields

  def save_by_system?
    self.created_by_name = 'system'
    self.save
  end
end
