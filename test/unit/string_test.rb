require 'test_helper'

class StringTest < ActiveSupport::TestCase

  test 'without_parens' do
    assert_equal 'hello world', "hello world (foo bar1)".without_parens
  end


end

