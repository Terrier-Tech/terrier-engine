# Default SystemController implementation. If client code defines its own SystemController, it should include Terrier::SystemActions
class SystemController < ApplicationController
  include Terrier::SystemActions

end