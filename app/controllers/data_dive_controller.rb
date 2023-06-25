require_relative '../../test/data/test_dive'
require 'terrier/data_dive/query_engine'
require 'niceql'


class DataDiveController < ApplicationController
  include Terrier::TerrierAuth

  skip_before_action :verify_authenticity_token

  def entrypoint
    @title = "Data Dive"
    @entrypoint = 'data-dive'
  end

  # get all dives associated with the current user
  def list
    user = _terrier_change_user
    dives = DdDive.where(_state: 0)
                  .where("owner_id = ? OR visibility = 'public'", user.id)
    render_api_success dives: dives, user: user
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

  # executes the query for a small limit to preview on the client
  def preview_query
    query = required_param :query
    engine = QueryEngine.new query
    res = engine.execute! limit: 100
    render_api_success res
  rescue => ex
    render_exception ex
  end
end