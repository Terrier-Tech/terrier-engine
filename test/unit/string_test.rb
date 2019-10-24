require 'test_helper'

class StringTest < ActiveSupport::TestCase

  test 'without_parens' do
    assert_equal 'hello world', "hello world (foo bar1)".without_parens
  end

  test 'postgres_array_literal' do
    assert_equal '{"jim", "joe", "jess"}', %w(jim joe jess).to_postgres_array_literal
  end

end

