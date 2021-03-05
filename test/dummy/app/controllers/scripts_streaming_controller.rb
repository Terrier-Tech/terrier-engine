require 'plunketts/scripts/script_executor'

class ScriptsStreamingController < ApplicationController
  include Plunketts::ScriptsStreaming


  def get_executor
    executor = ScriptExecutor.new @script
    executor.me = 'Script Executor'
    executor
  end

  def save_script?(script)
    script.save_by_system?
  end

  def save_run?(run)
    run.save_by_system?
  end

end