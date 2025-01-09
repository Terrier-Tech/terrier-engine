require 'terrier_auth'

# Use this controller concern to authenticate requests via ssh_
module Terrier::SshAuth
  extend ActiveSupport::Concern

  included do

    # Authenticates the ssh_challenge, ssh_signature, and ssh_public_key params.
    # See TerrierAuth::SshKeys#validate_challenge!
    # @return [Boolean] true if the ssh params are valid
    def authenticate_ssh?
      TerrierAuth::SshKeys.new.validate_challenge! params
      info "SSH Authenticated for public key #{params[:ssh_public_key]}"
      true
    rescue => ex
      warn "SSH Authentication failed: #{ex.message}"
      false
    end

    # Authenticates the ssh_challenge, ssh_signature, and ssh_public_key params.
    # See TerrierAuth::SshKeys#validate_challenge!
    # @raise [Exception] if the authentication fails
    def authenticate_ssh!
      TerrierAuth::SshKeys.new.validate_challenge! params
    end

  end

end
