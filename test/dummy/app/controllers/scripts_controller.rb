class ScriptsController < ApplicationController
  include Plunketts::ScriptCrud

  def index
    @title = 'Scripts'
  end

end