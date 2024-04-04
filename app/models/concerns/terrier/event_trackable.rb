# Provides a thread safe way to track created models within a block.
#
#   class User
#     include EventTrackable
#   end
#
#   User.track_events do
#     User.new(name: "Alice").save!
#   end
#   => [<User name="Alice"...>]
#
module Terrier::EventTrackable
  extend ActiveSupport::Concern

  included do
    after_create :track_event, if: -> { self.class.tracking? }
    thread_mattr_accessor :tracked, instance_accessor: false, default: nil
  end

  class_methods do
    # @return [Array<ActiveRecord::Base>] tracked models
    def track_events
      last_tracked = self.tracked
      self.tracked = []
      yield
      self.tracked
    ensure
      unless last_tracked.nil?
        last_tracked += self.tracked
      end
      self.tracked = last_tracked
    end

    def tracking?
      !self.tracked.nil?
    end
  end

  private

  def track_event
    self.class.tracked << self
  end
end