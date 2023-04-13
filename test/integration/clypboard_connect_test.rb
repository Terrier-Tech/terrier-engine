require 'test_helper'
require 'terrier/api/clypboard_connect_api'

class ClypboardConnectTest < ActionDispatch::IntegrationTest

  test "get_json" do
    client = ClypboardConnectApi.new 'test_test', 'https://connect-west.clypboard.com'
    client.clear_token # uncomment this for tests to run faster
    res = client.get_json "/action_logs.json", {}
    assert_equal 'success', res['status']
    ap res
  end

end