class SqlController < ApplicationController
  include Plunketts::SqlBase

  def index
    @title = 'SQL Test'
  end


end