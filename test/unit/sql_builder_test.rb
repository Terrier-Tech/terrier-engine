require 'test_helper'

class SqlBuilderTest < ActiveSupport::TestCase
  include Loggable

  NUM_LOCS = 1000

  setup do
    Location.destroy_all
    1.upto(NUM_LOCS) do |n|
      loc = Location.new display_name: "Location #{n}", number: n, status: 'special'
      loc.save_by_system!
    end
  end

  test 'objects' do
    results = bench 'get all locations' do
      SqlBuilder.new
          .select(%w(id display_name created_at))
          .from('locations')
          .where("created_at > '2010-01-01'")
          .exec
    end

    assert_equal NUM_LOCS, results.count
    assert_equal 'Location 1', results.first.display_name
    assert_equal  results.first['display_name'], results.first.display_name

    bench 'iterate over dates' do
      1000.times do
        results.each do |res|
          res.created_at
        end
      end
    end

  end

end