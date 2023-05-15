require_relative '../../test/data/test_queries'

class DataDiveController < ApplicationController
  include Terrier::TerrierAuth

  def index
    @title = "Data Dive"
    @entrypoint = 'data-dive'
  end

  def test_query
    query = TestQueries.send required_param(:query_id)
    render_api_success query: query
  end
end