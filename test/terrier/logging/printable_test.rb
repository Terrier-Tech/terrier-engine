require "test_helper"
require_relative "../../../lib/terrier/logging/printable"

class PrintableTest < ActiveSupport::TestCase

  fixtures :all
  
  class TestClass
    attr_accessor :var1, :var2
    def initialize(var1, var2)
      @var1 = var1
      @var2 = var2
    end
  end

  TestStruct = Struct.new(:var1, :var2)

  ## #object_to_h

  test "#{Printable.name} #object_to_h returns a HashWithIndifferentAccess" do
    object = {var1: 1, var2: 2}
    assert Printable.object_to_h(object).is_a?(HashWithIndifferentAccess)
  end

  test "#{Printable.name} #object_to_h returns a hash from a Hash with Symbol keys" do
    object = {var1: 1, var2: 2}
    assert_equal object.with_indifferent_access, Printable.object_to_h(object)
  end

  test "#{Printable.name} #object_to_h returns a hash from a Hash with String keys" do
    object = {"var1" => 1, "var2" => 2}
    assert_equal object.with_indifferent_access, Printable.object_to_h(object)
  end

  test "#{Printable.name} #object_to_h returns a hash from a Object that is an ancestor of ActiveRecord" do
    object = User.first
    expected = object.attributes.with_indifferent_access
    assert_equal expected, Printable.object_to_h(object)
  end

  test "#{Printable.name} #object_to_h returns a hash from a Class Object" do
    object = TestClass.new(1, 2)
    expected = {var1: 1, var2: 2}.with_indifferent_access
    assert_equal expected, Printable.object_to_h(object)
  end

  test "#{Printable.name} #object_to_h returns a hash from a Object that is an ancestor of a Struct" do
    object = TestStruct.new(1, 2)
    expected = {var1: 1, var2: 2}.with_indifferent_access
    assert_equal expected, Printable.object_to_h(object)
  end

  test "#{Printable.name} #object_to_h returns a hash from a SqlBuilder QueryResult" do
    user = SqlBuilder.new.select("*", "users").from("users").exec.first
    expected = User.find(user.id).attributes.with_indifferent_access
    assert_equal expected, Printable.object_to_h(user)
  end

  ## #map_elements_to_h

  test "#{Printable.name} #map_elements_to_h returns an array of hashes from array of Class Objects" do
    array = 3.times.map { |index| TestClass.new(index, index + 1) }
    expected = 3.times.map { |index| {var1: index, var2: index + 1}.with_indifferent_access }
    assert_equal expected, Printable.map_elements_to_h(array)
  end

  ## #pretty_array

  test "#{Printable.name} #pretty_array returns a JSON pretty generated Array of Hashes" do
    array = 3.times.map { |index| TestClass.new(index, index + 1) }
    expected = JSON.pretty_generate 3.times.map { |index| {var1: index, var2: index + 1}.with_indifferent_access }
    assert_equal expected, Printable.pretty_array(array)
  end

  [[:var1], ["var1"], %i[var1 var2], %w[var1 var2]].each do |test_attrs|
    test "#{Printable.name} #pretty_array only returns specified attributes if passed #{test_attrs}" do
      array = 3.times.map { |index| TestClass.new(index, index + 1) }
      expected = JSON.pretty_generate array.map { |element| Printable.object_to_h(element).slice(*test_attrs) }
      assert_equal expected, Printable.pretty_array(array, test_attrs)
    end
  end

  ## #pretty_object

  test "#{Printable.name} #pretty_array returns a JSON pretty generated Hash" do
    object = TestClass.new(1, 2)
    expected = JSON.pretty_generate Printable.object_to_h(object)
    assert_equal expected, Printable.pretty_object(object)
  end

  [[:var1], ["var1"], %i[var1 var2], %w[var1 var2]].each do |test_attrs|
    test "#{Printable.name} #pretty_object only returns specified attributes if passed #{test_attrs}" do
      object = TestClass.new(1, 2)
      expected = JSON.pretty_generate Printable.object_to_h(object).slice(*test_attrs)
      assert_equal expected, Printable.pretty_object(object, test_attrs)
    end
  end
end