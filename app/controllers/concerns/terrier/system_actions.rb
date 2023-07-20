module Terrier::SystemActions
  extend ActiveSupport::Concern

  included do
    def top
      @top = Top.compute
      render_api_success @top
    rescue => ex
      render_exception ex
    end

    def public_key
      cmd = "find #{File.expand_path('~/.ssh')} -name 'id_*.pub'"
      info "Finding public key path with: #{cmd.bold}"
      path = `#{cmd}`.strip
      info "Reading public key from #{path.blue}"
      key = File.read(path).strip
      render_api_success public_key: key
    rescue => ex
      render_exception ex
    end
  end
end
