require_relative '../../test/data/test_dive'
require 'terrier/data_dive/query_engine'
require 'niceql'


class DataDiveController < ApplicationController
  include Terrier::TerrierAuth

  skip_before_action :verify_authenticity_token

  # all pages use the same entrypoint action on the server,
  # the routing is done on the client side
  def entrypoint
    @title = "Data Dive"
    @entrypoint = 'data-dive'
  end

  # authentication and option data for the session
  def user_session
    user = _terrier_change_user
    raise "Must be logged in!" unless user
    user = user.attributes.slice *%w[first_name last_name name id role]
    info "Session user: #{user.inspect}"
    render_api_success user: user
  end

  # get all dives associated with the current user
  def list
    user = _terrier_change_user
    dives = DdDive.where(_state: 0)
                  .where("owner_id = ? OR visibility = 'public'", user.id)
                  .order(name: :asc)

    groups = DdDiveGroup.where(_state: 0)
                        .order(name: :asc)

    render_api_success dives: dives, user: user, groups: groups
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