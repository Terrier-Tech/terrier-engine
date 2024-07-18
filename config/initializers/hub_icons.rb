# This file was automatically generated on 2024-07-18 14:22:23 -0500, DO NOT EDIT IT MANUALLY!
require 'benchmark'

# prefer HubIcons.all
HUB_ICON_NAMES = %i[active admin archive arrow_down arrow_left arrow_right arrow_up assign attachment back badge board branch bug calculator checkmark close clypboard comment complete dashboard data_pull data_update database day delete documentation edit existing_child existing_parent feature flex forward github history home image inbox info internal issue lane lane_asap lane_days lane_hours lane_weeks lanes_board level_complete level_highway level_on_ramp level_parking link list_view metrics minus new_child new_parent night origin pending plot plus post posts pr_closed pr_merged pr_open prioritized project question reaction read_mail recent refresh related_posts releases request settings split_view status step_deploy step_develop step_investigate step_review step_test steps steps_board subscribe support terrier thumbs_up type unprioritized upload user users website week]

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
if Dir[Terrier::Engine.root.join("app/frontend/terrier/images/icons/*").to_s].count == 0
  return
end

Benchmark.measure "Loading icons" do
  HUB_ICON_NAMES.each do |name|
    HUB_ICONS[name] = File.read Terrier::Engine.root.join("app/frontend/terrier/images/icons/#{name}.svg")
  end
end