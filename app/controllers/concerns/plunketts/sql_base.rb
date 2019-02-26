
module Plunketts::SqlBase
  extend ActiveSupport::Concern

  included do

    def exec
      begin
        query = SqlBuilder.from_raw params[:query]
        res = query.exec
        render_success "Got #{res.count} Results", {result: res}
      rescue => ex
        render_exception ex
      end
    end

  end

end

