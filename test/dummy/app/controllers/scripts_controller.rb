class ScriptsController < ApplicationController
  include Terrier::ScriptCrud

  def index
    @title = 'Scripts'
    respond_to do |format|
      format.html
      format.json do
        begin
          scripts = ActiveRecord::Base.connection.execute list_query(nil)
          render_success "Listing #{scripts.count} Scripts", scripts: scripts
        rescue => ex
          render_exception ex
        end
      end
    end
  end

  def save_script?(script)
    script.save_by_system?
  end

  def save_run?(run)
    run.save_by_system?
  end

  # subclasses can implement this to override the values and options
  def override_fields(script, values, options)
    values['org_unit_id'] = 'two'
    values['hidden_id'] = params[:foo]
  end

  def reports
    @scripts = Script.where('title IS NOT NULL')
	  @title = 'Reports'
  end

end