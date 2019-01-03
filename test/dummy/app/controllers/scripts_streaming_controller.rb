class ScriptsStreamingController < ApplicationController
  include Plunketts::ScriptsStreaming



  def save_script?(script)
    script.save_by_system?
  end

  def save_run?(run)
    run.save_by_system?
  end

end