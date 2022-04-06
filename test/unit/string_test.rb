require 'test_helper'

class StringTest < ActiveSupport::TestCase

  test 'truthiness' do
    assert 'true'.is_true?
    assert '1'.is_true?
    assert 'T'.is_true?
    assert 'on'.is_true?
    assert !'off'.is_true?
    assert 'off'.is_false?
    assert !'foo'.is_false?
    assert '0'.is_false?
    assert !'true'.is_false?
  end

  test 'without_parens' do
    assert_equal 'hello world', "hello world (foo bar1)".without_parens
  end

  test 'postgres_array_literal' do
    assert_equal '{"jim", "joe", "jess"}', %w(jim joe jess).to_postgres_array_literal
  end

end

