class ApplicationRecord < ActiveRecord::Base
  self.abstract_class = true

  include Plunketts::Fields
end
