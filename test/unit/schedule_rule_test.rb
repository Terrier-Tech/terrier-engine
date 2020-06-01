require 'test_helper'

class ScheduleRuleTest < ActiveSupport::TestCase

  test 'every other week' do
    rule1 = ScheduleRule.new days: %w(tuesday), weeks: %w(1 3 5), months: ScheduleRule.months
    assert_equal 28, rule1.num_per_year
    rule2 = ScheduleRule.new days: %w(tuesday), weeks: %w(2 4), months: ScheduleRule.months
    assert_equal 24, rule2.num_per_year
  end

  test 'fifth week' do
    rule = ScheduleRule.new days: %w(tuesday), weeks: %w(5), months: ScheduleRule.months
    assert_equal 4, rule.num_per_year
    rule = ScheduleRule.new days: %w(tuesday), weeks: %w(2 5), months: ScheduleRule.months
    assert_equal 16, rule.num_per_year
    rule = ScheduleRule.new days: %w(tuesday), weeks: %w(1 2 3 5), months: ScheduleRule.months
    assert_equal 40, rule.num_per_year
  end

  test 'contains' do
    rule = ScheduleRule.new days: %w(tuesday), weeks: ['all'], months: ScheduleRule.months
    assert rule.contains_day?(Time.parse('2017-09-05'))
    assert !rule.contains_day?(Time.parse('2017-09-04'))
  end


end