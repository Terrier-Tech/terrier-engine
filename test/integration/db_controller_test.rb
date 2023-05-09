require "test_helper"

class DbControllerTest < ActionDispatch::IntegrationTest

  def assert_success!
    res = JSON.parse @response.body
    assert_response :success
    ap res unless res['status'] == 'success'
    assert_equal 'success', res['status'], res['message']
    res
  end

  def assert_error!
    res = JSON.parse @response.body
    assert_response :success # the HTTP response is still a success
    ap res unless res['status'] == 'error'
    assert_equal 'error', res['status'], res['message']
    res
  end

  test "successfully create a location" do
    # minimum viable location
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

  test "fail to create a location" do
    # very incomplete location
    raw_loc = {
      city: 'Minneapolis',
      state: 'MN'
    }
    post "/db/model/location/upsert.json", params: { record: raw_loc }
    res = assert_error!

    assert res['backtrace'].is_a?(Array)

    errors = res['errors']
    assert errors.is_a?(Hash)
    assert errors.has_key?('display_name')
    assert errors.has_key?('number')
    assert errors.has_key?('status')

    record = res['record']
    assert record.is_a?(Hash)
    assert_equal raw_loc[:city], record['city']
    assert_equal raw_loc[:state], record['state']
  end


end