module Printable
  extend self

  # @param _array [Array<Object>] Array of Objects to turn into pretty generated String
  # @param attrs [Array<String>, Array<Symbol>] Array of attributes to show for each element
  # @return [String] pretty generated JSON
  def pretty_array(_array, attrs = nil)
    array = map_elements_to_h _array
    array = array.map { |element| element.slice(*attrs) } if attrs
    JSON.pretty_generate array
  end

  # @param _object [Object] Object to turn into pretty generated String
  # @param attrs [Array<String>, Array<Symbol>] Array of attributes to show for object
  # @return [String] pretty generated JSON
  def pretty_object(_object, attrs = nil)
    object = object_to_h _object
    object = object.slice *attrs if attrs
    JSON.pretty_generate object
  end

  # @param array [Array<Object>] Array of Objects to turn into a Hash
  # @return [Array<HashWithIndifferentAccess>]
  def map_elements_to_h(array)
    array.map { |object| object_to_h object }
  end

  # @param object [Object] Object to turn into a hash
  # @return [HashWithIndifferentAccess]
  def object_to_h(object)
    ancestors = object.class.ancestors
    hash = if object.is_a?(Hash)
             object
           elsif object.is_a?(QueryRow)
             object.keys.reduce({}) do |acc, key|
               acc[key] = object.send(key) == "{}" ? [] : object.send(key)
               acc
             end
           elsif ancestors.include? ActiveRecord::Base
             object.attributes.symbolize
           elsif ancestors.include? Struct
             object.to_h
           elsif object.is_a?(Object)
             object.instance_variables.to_h do |key|
               [key.to_s.delete('@').to_sym, object.instance_variable_get(key)]
             end
           else
             raise "Don't know how to turn object class into hash: '#{object.class.name}'"
           end
    hash.with_indifferent_access
  end
end