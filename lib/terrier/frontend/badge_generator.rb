# internal use only, access badge metadata with Badges.all
RAW_BADGES = {
  accounts_payable: {
    roles: %w[handling]
  },
  accounts_receivable: {
    roles: %w[handling]
  },
  applicator_license: {
    roles: %w[admin]
  },
  autopay: {
    roles: %w[admin handling]
  },
  bats: {
    roles: %w[admin management ops sales]
  },
  clypboard_hardware: {
    roles: %w[admin]
  },
  clypboard_project: {
    roles: %w[admin]
  },
  clypmart: {
    roles: %w[admin]
  },
  commercial: {
    roles: %w[admin management ops sales]
  },
  compliance: {
    roles: %w[admin]
  },
  contracts: {
    roles: %w[admin reporting]
  },
  copesan: {
    roles: %w[admin]
  },
  credit_card: {
    roles: %w[admin]
  },
  customer_call: {
    roles: %w[handling]
  },
  customer_text: {
    roles: %w[handling]
  },
  employee_data: {
    roles: %w[admin handling reporting]
  },
  finance: {
    roles: %w[admin reporting]
  },
  fleet: {
    roles: %w[admin]
  },
  fumigation: {
    roles: %w[admin management ops]
  },
  information_technology: {
    title: 'IT',
    roles: %w[admin management]
  },
  irrigation: {
    roles: %w[admin management ops sales]
  },
  landscape: {
    roles: %w[admin management ops sales]
  },
  marketing: {
    roles: %w[admin]
  },
  mergers_and_acquisitions: {
    title: 'M&A',
    roles: %w[admin reporting]
  },
  multi_housing: {
    title: 'Multi-Housing',
    roles: %w[admin management ops sales]
  },
  payroll: {
    roles: %w[admin reporting]
  },
  pest: {
    roles: %w[admin management ops sales]
  },
  pro: {
    roles: %w[admin management ops sales]
  },
  program: {
    roles: %w[admin]
  },
  proposals: {
    roles: %w[handling]
  },
  residential: {
    roles: %w[admin management ops sales]
  },
  sales: {
    roles: %w[management reporting]
  },
  scripts: {
    roles: %w[admin reporting]
  },
  termite: {
    roles: %w[admin management ops sales]
  },
  wildlife: {
    roles: %w[admin management ops sales]
  }
}

require 'terrier/frontend/base_generator'

# manage the generation of badge images and list of possible badges
class BadgeGenerator < BaseGenerator

  # @param options [Hash]
  def run(options)
    image_in_dir = options[:image_in_dir] || raise("Must provide :image_in_dir pointing to input image directory")
    image_out_dir = options[:image_out_dir] || raise("Must provide :image_out_dir pointing to output image directory")
    clear_directory image_out_dir

    badge_titles = {}
    RAW_BADGES.each do |base_key, raw_badge|
      base_title = raw_badge[:title].presence || base_key.to_s.titleize
      roles = raw_badge[:roles] || raise("No roles specified for badge #{base_key.bold}")
      roles.each do |role|
        key = "#{base_key}-#{role}"
        title = "#{base_title} #{role.titleize}"
        badge_titles[key] = title

        # generate the image
        combine_svgs %W[#{image_in_dir}/badge-#{base_key}.svg #{image_in_dir}/badge_role-#{role}.svg],
                     "#{image_out_dir}/badge-#{key}.svg"
      end
    end
    info "#{badge_titles.count.to_s.bold} badges from #{RAW_BADGES.count.to_s.italic} base badge names"
    all_badges = badge_titles.keys.sort

    # make typescript-acceptable variable names for the badge image imports
    badge_vars = {}
    all_badges.each do |badge|
      badge_vars[badge] = badge.camelize.gsub('-', '')
    end

    render_template 'badges.rb', binding
    render_template 'badges.ts', binding
  end

end