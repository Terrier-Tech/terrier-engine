# This file was automatically generated, DO NOT EDIT IT MANUALLY!
require 'benchmark'

# prefer use of Icons.all
HUB_ICON_NAMES = %i[active admin archive arrow_down arrow_left arrow_right arrow_up assign attachment back badge board branch bug calculator checkmark close clypboard comment complete dashboard data_pull data_update database day delete documentation edit feature flex forward github history home image inbox info issue lane lane_asap lane_days lane_hours lane_weeks lanes_board level_complete level_highway level_on_ramp level_parking minus night origin pending plus post pr_closed pr_merged pr_open prioritized project question reaction recent refresh request settings status step_deploy step_develop step_investigate step_review step_test steps steps_board subscribe support terrier thumbs_up type unprioritized upload user users]

HUB_ICONS = {}

module HubIcons
  def self.all
    HUB_ICON_NAMES
  end

  def self.raw(name)
    HUB_ICONS[name]
  end
end

# abort if there are no icons (we're generating them)
if Dir[Rails.root.join("app/frontend/terrier/images/icons/*").to_s].count == 0
  return
end

Benchmark.measure "Loading icons" do
  HUB_ICON_NAMES.each do |name|
    HUB_ICONS[name] = File.read Rails.root.join("app/frontend/terrier/images/icons/#{name}.svg")
  end
end