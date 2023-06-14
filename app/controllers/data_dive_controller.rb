require_relative '../../test/data/test_dive'
require 'terrier/data_dive/query_engine'
require 'niceql'


class DataDiveController < ApplicationController
  include Terrier::TerrierAuth

  skip_before_action :verify_authenticity_token

  def index
    @title = "Data Dive"
    @entrypoint = 'dd-dive-editor'
  end

  def test_dive
    dive = TestDive.get
    render_api_success dive: dive
  end

  # validates the query and computes the raw SQL for it if it's valid
  def validate_query
    query = required_param :query
    engine = QueryEngine.new query
    res = engine.validate
    render_api_success res
  rescue => ex
    render_exception ex
  end
end