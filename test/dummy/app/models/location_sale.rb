class LocationSale < ApplicationRecord

  belongs_to :contract
  has_one :program, through: :contract

end