require_relative '../../terrier/system/ssh_key_manager'

namespace :ssh do

  desc "Updates the authorized_keys file with the public keys from terrier.tech"
  task :update_public_keys do
    SshKeyManager.new.update_public_keys
  end


  desc "Generates a challenge and signature pair for this client"
  task generate_challenge: :environment do
    manager = SshKeyManager.new
    data = manager.generate_challenge
    ap data
    if manager.validate_challenge! data
      puts "Challenge successfully validated!".green
    else
      puts "Challenge failed to validate!".red
    end
  end

end