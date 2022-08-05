require 'terrier/scripts/script_executor'

class ScriptsStreamingController < ApplicationController
  include Terrier::ScriptsStreaming


  def get_executor
    executor = ScriptExecutor.new @script, params: params
    executor.me = 'Script Executor'
    executor.file_base_url = "https://testing.com"
    executor
  end

  def save_script?(script)
    script.save_by_system?
  end

  def save_run?(run)
    run.save_by_system?
  end

end