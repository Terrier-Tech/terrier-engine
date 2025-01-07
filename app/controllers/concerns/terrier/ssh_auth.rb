# Use this controller concern to authenticate requests via ssh_
module Terrier::SshAuth
  extend ActiveSupport::Concern

  included do

    # Authenticates the ssh_challenge, ssh_signature, and ssh_public_key params.
    # See SshKeyManager#validate_challenge!
    # @return [Boolean] true if the ssh params are valid
    def authenticate_ssh?
      SshKeyManager.new.validate_challenge! params
      true
    rescue => ex
      warn "SSH Authentication failed: #{ex.message}"
      false
    end

    # Authenticates the ssh_challenge, ssh_signature, and ssh_public_key params.
    # See SshKeyManager#validate_challenge!
    # @raise [Exception] if the authentication fails
    def authenticate_ssh!
      SshKeyManager.new.validate_challenge! params
    end

  end

end
