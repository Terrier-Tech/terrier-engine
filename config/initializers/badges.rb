# This file was automatically generated on 2024-07-17 08:41:32 -0500, DO NOT EDIT IT MANUALLY!
# prefer use of Badges.all
BADGE_TITLES = {"accounts_payable-handling"=>"Accounts Payable Handling", "accounts_receivable-handling"=>"Accounts Receivable Handling", "applicator_license-admin"=>"Applicator License Admin", "autopay-admin"=>"Autopay Admin", "autopay-handling"=>"Autopay Handling", "bats-admin"=>"Bats Admin", "bats-management"=>"Bats Management", "bats-ops"=>"Bats Ops", "bats-sales"=>"Bats Sales", "clypboard_hardware-admin"=>"Clypboard Hardware Admin", "clypboard_project-admin"=>"Clypboard Project Admin", "clypmart-admin"=>"Clypmart Admin", "commercial-admin"=>"Commercial Admin", "commercial-management"=>"Commercial Management", "commercial-ops"=>"Commercial Ops", "commercial-sales"=>"Commercial Sales", "compliance-admin"=>"Compliance Admin", "contracts-admin"=>"Contracts Admin", "contracts-reporting"=>"Contracts Reporting", "copesan-admin"=>"Copesan Admin", "credit_card-admin"=>"Credit Card Admin", "customer_call-handling"=>"Customer Call Handling", "customer_text-handling"=>"Customer Text Handling", "employee_data-admin"=>"Employee Data Admin", "employee_data-handling"=>"Employee Data Handling", "employee_data-reporting"=>"Employee Data Reporting", "finance-admin"=>"Finance Admin", "finance-reporting"=>"Finance Reporting", "fleet-admin"=>"Fleet Admin", "fumigation-admin"=>"Fumigation Admin", "fumigation-management"=>"Fumigation Management", "fumigation-ops"=>"Fumigation Ops", "information_technology-admin"=>"IT Admin", "information_technology-management"=>"IT Management", "irrigation-admin"=>"Irrigation Admin", "irrigation-management"=>"Irrigation Management", "irrigation-ops"=>"Irrigation Ops", "irrigation-sales"=>"Irrigation Sales", "landscape-admin"=>"Landscape Admin", "landscape-management"=>"Landscape Management", "landscape-ops"=>"Landscape Ops", "landscape-sales"=>"Landscape Sales", "marketing-admin"=>"Marketing Admin", "mergers_and_acquisitions-admin"=>"M&A Admin", "mergers_and_acquisitions-reporting"=>"M&A Reporting", "multi_housing-admin"=>"Multi-Housing Admin", "multi_housing-management"=>"Multi-Housing Management", "multi_housing-ops"=>"Multi-Housing Ops", "multi_housing-sales"=>"Multi-Housing Sales", "payroll-admin"=>"Payroll Admin", "payroll-reporting"=>"Payroll Reporting", "pest-admin"=>"Pest Admin", "pest-management"=>"Pest Management", "pest-ops"=>"Pest Ops", "pest-sales"=>"Pest Sales", "pro-admin"=>"Pro Admin", "pro-management"=>"Pro Management", "pro-ops"=>"Pro Ops", "pro-sales"=>"Pro Sales", "program-admin"=>"Program Admin", "proposals-handling"=>"Proposals Handling", "residential-admin"=>"Residential Admin", "residential-management"=>"Residential Management", "residential-ops"=>"Residential Ops", "residential-sales"=>"Residential Sales", "sales-management"=>"Sales Management", "sales-reporting"=>"Sales Reporting", "scripts-admin"=>"Scripts Admin", "scripts-reporting"=>"Scripts Reporting", "termite-admin"=>"Termite Admin", "termite-management"=>"Termite Management", "termite-ops"=>"Termite Ops", "termite-sales"=>"Termite Sales", "wildlife-admin"=>"Wildlife Admin", "wildlife-management"=>"Wildlife Management", "wildlife-ops"=>"Wildlife Ops", "wildlife-sales"=>"Wildlife Sales"}

BADGES = BADGE_TITLES.keys

BADGE_IMAGES = {}

# Badge metadata and helpers
module Badges

  def self.all
    BADGES
  end

  def self.image(badge)
    BADGE_IMAGES[badge]
  end

  def self.title(badge)
    BADGE_TITLES[badge] || badge.titleize
  end

end

# abort if there are no images (we're generating them)
if Dir[Terrier::Engine.root.join("app/frontend/terrier/images/badges/*").to_s].count == 0
  return
end

BADGES.each do |badge|
  BADGE_IMAGES[badge] = File.read Terrier::Engine.root.join("app/frontend/terrier/images/badges/badge-#{badge}.svg")
end