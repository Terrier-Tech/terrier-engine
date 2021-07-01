# include this module in the ScriptRun model
module Terrier::ScriptRunBase
  extend ActiveSupport::Concern

  included do

    belongs_to :script

    enum_field :status, %w(running success error cancelled cleared)

    validates :duration, presence: true

  end

end
