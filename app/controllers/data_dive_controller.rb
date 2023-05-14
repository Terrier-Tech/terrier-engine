class DataDiveController < ApplicationController
  include Terrier::TerrierAuth

  def index
    @title = "Data Dive"
    @entrypoint = 'data-dive'
  end
end