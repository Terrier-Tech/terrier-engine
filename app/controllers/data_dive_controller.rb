require_relative '../../test/data/test_dive'

class DataDiveController < ApplicationController
  include Terrier::TerrierAuth

  def index
    @title = "Data Dive"
    @entrypoint = 'dd-dive-editor'
  end

  def test_dive
    dive = TestDive.get
    render_api_success dive: dive
  end
end