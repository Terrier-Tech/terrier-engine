
module Terrier::Schedulable
  extend ActiveSupport::Concern
  include Terrier::Embedder

  included do

    embeds_many :schedule_rules

    attr_reader :schedule_rules_s

    # field :schedule_rule_summaries, type: Array

    def schedule_rules_s=(s)
      unless s.blank? # if you really want to blank out the schedule rules, pass '[]'
        self.schedule_rules = JSON.parse(s)
        self.schedule_rules_will_change!
      end

      update_schedule_rule_summaries
    end

    def update_schedule_rule_summaries
      rules = self.schedule_rules
      if rules
        self.schedule_rule_summaries = rules.map do |rule|
          rule.summary
        end
      end
    end

    def has_schedule?
      (self.schedule_rules || []).length > 0
    end


    def orders_per_year
      if self.schedule_rules && self.schedule_rules.length > 0
        self.schedule_rules.map{|rule| rule.num_per_year}.sum
      else
        0
      end
    end

    def orders_per_month
      if self.schedule_rules && self.schedule_rules.length > 0
        pm = {}
        self.schedule_rules.each do |rule|
          this_pm = rule.num_per_month
          this_pm.each do |month, num|
            if pm.has_key? month
              pm[month] += num
            else
              pm[month] = num
            end
          end
        end
        pm
      else
        {}
      end
    end

    # field :num_per_year, type: Integer

    def store_num_per_year
      self.num_per_year = self.orders_per_year
    end

    before_save :store_num_per_year


    # returns true if one of the rules contains the given day
    def schedule_contains_day?(day)
      (self.schedule_rules || []).each do |rule|
        if rule.contains_day? day
          return true
        end
      end
      false
    end

    # returns true if one of the rules contains the given hour
    def schedule_contains_hour?(hour)
      (self.schedule_rules || []).each do |rule|
        if rule.contains_hour? hour
          return true
        end
      end
      false
    end

    @schedule_types = %w(every none schedule)

    def self.type_options
      @schedule_types.map do |s|
        [s.humanize, s]
      end
    end

    # field :schedule_type, type: String, in: @schedule_types, default: @schedule_types.first, index: true

    def schedulable_icon
      case self.schedule_type
      when 'every'
        'loop'
      when 'none'
        'ios-bolt'
      when 'schedule'
        'calendar'
      else
        raise "Oops,invalid schedule_type '#{self.schedule_type}'"
      end
    end


    enum_field :order_grouping, %w(combine separate)

  end

end
