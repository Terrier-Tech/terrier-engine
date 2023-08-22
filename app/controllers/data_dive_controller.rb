

class DataDiveController < ApplicationController
  include Terrier::TerrierAuth
  include DataDive::Endpoints
  include ActionController::Live

  skip_before_action :verify_authenticity_token

end