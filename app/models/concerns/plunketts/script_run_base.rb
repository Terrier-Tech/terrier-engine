# include this module in the ScriptRun model
module Plunketts::ScriptRunBase
  extend ActiveSupport::Concern

  included do

    belongs_to :script

    enum_field :status, %w(success error cancelled)

    validates :duration, presence: true

  end

end
