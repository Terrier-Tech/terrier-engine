# Include this concern in any controller that needs to access the injected
# terrier authentication and change user methods
module Terrier::TerrierAuth
  extend ActiveSupport::Concern

  included do

    before_action :_terrier_authenticate

    def _terrier_layout
      if self.respond_to? :terrier_layout
        self.terrier_layout
      else
        warn "The #terrier_layout method should implemented in your ApplicationController!"
        'application'
      end
    end

    def _terrier_authenticate
      if self.respond_to? :terrier_authenticate
        self.terrier_authenticate
      else
        warn "The #terrier_authenticate method should implemented in your ApplicationController!"
      end
    end

    def _terrier_change_user
      if self.respond_to? :terrier_change_user
        self.terrier_change_user
      else
        warn "The #terrier_change_user method should implemented in your ApplicationController!"
        'terrier_change_user'
      end
    end
  end
end
