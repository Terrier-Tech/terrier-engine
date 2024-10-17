require_relative '../../terrier/system/ssh_key_manager'

namespace :ssh do

  desc "Updates the authorized_keys file with the public keys from terrier.tech"
  task :update_public_keys do
    SshKeyManager.new.update_public_keys
  end

end