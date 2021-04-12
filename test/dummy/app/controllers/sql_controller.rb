class SqlController < ApplicationController
  include Terrier::SqlBase

  def index
    @title = 'SQL Test'
  end


end