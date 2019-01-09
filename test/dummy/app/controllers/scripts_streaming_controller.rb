require 'plunketts/scripts/script_executer'

class ScriptsStreamingController < ApplicationController
  include Plunketts::ScriptsStreaming


  def get_executer
    executer = ScriptExecutor.new @script
    executer.me = 'Script Executer'
    executer
  end

  def save_script?(script)
    script.save_by_system?
  end

  def save_run?(run)
    run.save_by_system?
  end

end