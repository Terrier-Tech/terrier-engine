require "test_helper"
require_relative "../../../app/models/concerns/terrier/event_trackable"

class EventTrackableTest < ActiveSupport::TestCase

  def setup
    create_mock_table :mock_models
  end

  # @param table_name [Symbol]
  def create_mock_table(table_name)
    ActiveRecord::Migration.suppress_messages do
      ActiveRecord::Schema.define do
        create_model table_name do |table|
          table.text :name, default: "Name"
        end
      end
    end
  end

  class MockModel < ApplicationRecord
    include Terrier::EventTrackable
  end

  class OtherModel < ApplicationRecord
    include Terrier::EventTrackable
  end

  # @return [Tempfile]
  def prepare_txt_file(file_name, content:)
    file = Tempfile.new file_name
    file.write content
    file.rewind
    file
  end

  test "returns [] when no events are tracked" do
    assert_equal([], MockModel.track_events {})
  end

  test "resets tracked events after tracking is done" do
    MockModel.track_events { MockModel.new.save_by! }
    assert_equal([], MockModel.track_events {})
  end

  test "resets tracked events if an error is raised" do
    begin
      MockModel.track_events do
        MockModel.new.save_by!
        raise "Error"
      end
    rescue
      # continue
    end
    assert_equal([], MockModel.track_events {})
  end

  test "does not track events before tracking is called" do
    MockModel.new.save_by!
    assert_equal([], MockModel.track_events {})
  end

  test "does not track events after tracking is called" do
    tracked = MockModel.track_events {}
    MockModel.new.save_by!
    assert_equal [], tracked
  end

  test "tracks single create event" do
    model = nil
    tracked = MockModel.track_events do
      model = MockModel.new
      model.save_by!
    end
    assert_equal [model], tracked
  end

  test "tracks multiple create events" do
    models = nil
    tracked = MockModel.track_events do
      models = [MockModel.new, MockModel.new]
      models.each(&:save_by!)
    end
    assert_equal models, tracked
  end

  test "does not track update events" do
    model = MockModel.new
    model.save_by!
    tracked = MockModel.track_events do
      model.name = "New Name"
      model.save_by!
    end
    assert_equal [], tracked
  end

  test "does not track events on other models" do
    create_mock_table :other_models
    tracked = MockModel.track_events { OtherModel.new.save_by! }
    assert_equal [], tracked
  end

  test "allows for nested tracking calls" do
    level_1, level_2, level_3 = [], [], []
    tracked_2, tracked_3 = nil

    tracked_1 = MockModel.track_events do # level 1
      model = MockModel.new
      model.save_by!
      level_1 << model
      tracked_2 = MockModel.track_events do # level 2
        model = MockModel.new
        model.save_by!
        [level_1, level_2].each { _1 << model }
        tracked_3 = MockModel.track_events do # level 3
          model = MockModel.new
          model.save_by!
          [level_1, level_2, level_3].each { _1 << model }
        end
      end
    end

    assert_equal [level_1, level_2, level_3], [tracked_1, tracked_2, tracked_3]
  end

  test "tracks events over multiple threads separately" do
    tracked_1, tracked_2, model_1, model_2 = nil

    thread_1 = Thread.new do
      tracked_1 = MockModel.track_events do
        model_1 = MockModel.new
        model_1.save_by!
        sleep 0.1 # ensure second thread can start
      end
    end
    thread_2 = Thread.new do
      tracked_2 = MockModel.track_events do
        model_2 = MockModel.new
        model_2.save_by!
      end
    end

    thread_1.join
    thread_2.join

    assert_equal [[model_1], [model_2]], [tracked_1, tracked_2]
  end

  test "tracks events over multiple io bound threads separately" do
    file_1 = prepare_txt_file "name_1.txt", content: "Name 1 " * 100_000
    file_2 = prepare_txt_file "name_2.txt", content: "Name 2 " * 100_000

    tracked_1, tracked_2, model_1, model_2 = nil

    thread_1 = Thread.new do
      tracked_1 = MockModel.track_events do
        model_1 = MockModel.new(name: File.read(file_1.path))
        model_1.save_by!
        sleep 0.1 # ensure second thread can start
      end
    end
    thread_2 = Thread.new do
      tracked_2 = MockModel.track_events do
        model_2 = MockModel.new(name: File.read(file_2.path))
        model_2.save_by!
      end
    end

    thread_1.join
    thread_2.join

    assert_equal [[model_1], [model_2]], [tracked_1, tracked_2]
  ensure
    [file_1, file_2].each(&:close)
    [file_1, file_2].each(&:unlink)
  end
end