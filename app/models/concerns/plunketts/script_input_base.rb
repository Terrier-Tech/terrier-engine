# include this module in the ScriptInput model
module Plunketts::ScriptInputBase
  extend ActiveSupport::Concern

  included do

    belongs_to :script


  end

end
