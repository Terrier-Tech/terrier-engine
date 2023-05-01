require "test_helper"

class DbControllerTest < ActionDispatch::IntegrationTest

  def assert_success!
    res = JSON.parse @response.body
    assert_response :success
    ap res unless res['status'] == 'success'
    assert_equal 'success', res['status'], res['message']
    res
  end

  test "create a location" do
    raw_loc = {
      display_name: 'Test Location',
      status: 'contract',
      city: 'Minneapolis',
      state: 'MN',
      number: 1
    }
    post "/db/model/location/upsert.json", params: { record: raw_loc }
    res = assert_success!
    res_project = res['record']
    assert_equal raw_loc[:display_name], res_project['display_name']
  end

end