require 'http'
require 'ssh_data'

# manages SSH public keys distributed by terrier.tech
class SshKeyManager
  include Loggable

  def initialize
    @env = Rails.env&.to_s || 'development'
  end

  # updates the keys in the authorized_keys file based on the given clyp from terrier.tech
  def update_public_keys
    info "Updating public keys"

    # compute the authorized_keys path
    if @env == 'development'
      dir = Rails.root.join('tmp/ssh').to_s
      FileUtils.mkdir_p(dir) unless File.exist?(dir)
      file_path = "#{dir}/authorized_keys"
      info "Using dummy authorized_keys path in development: #{file_path}"
    else
      file_path = File.expand_path "~/.ssh/authorized_keys"
      info "Using authorized_keys path: #{file_path}"
    end

    File.open(file_path, "r+:US-ASCII") do |file|
      # lock the file to avoid contention with other apps on the same machine editing this file simultaneously
      lock = file.flock(File::LOCK_EX | File::LOCK_NB)
      unless lock
        info "Another process is already updating keys!"
        return
      end

      # get the keys
      res = HTTP.get "https://terrier.tech/public_keys.json"
      raw = JSON.parse res.to_s
      unless raw['status'] == 'success'
        ap raw
        raise "Error getting public keys: #{res['message']}"
      end
      new_keys = raw['public_keys'].sort
      info "Found #{new_keys.count} keys"
      new_keys.each do |key|
        puts key
      end

      # read existing keys
      existing_keys = file.read.split("\n").compact.map(&:strip).sort
      info "#{existing_keys.count} existing keys in #{file_path}"

      # abort if the existing keys are the same as the new ones
      if existing_keys.join == new_keys.join
        info "Existing keys are the same as the new ones, nothing to do"
        return
      end

      # write the existing keys to a backup file
      if existing_keys.present?
        backup_path = "#{file_path}_#{Time.new.strftime(TIMESTAMP_FORMAT)}"
        info "Existing keys are different than the new ones, writing them to #{backup_path}"
        File.write backup_path, existing_keys.join("\n")
      else
        info "No existing keys, nothing to back up"
      end

      # write the new keys
      info "Writing new keys to #{file_path}"
      file.pos = 0
      file.truncate(0)
      file.write(new_keys.join("\n"))
    end
  end

  # @return [String] the absolute directory to the ssh files on this machine.
  def ssh_dir
    File.expand_path("~/.ssh/*")
  end

  # Gets the private key for this machine.
  # Assumes it's in ~/.ssh and has a standard name like id_rsa or id_ed25519.
  # @return [SSHData::PrivateKey::Base]
  def load_private_key
    # compute the file path
    private_key_files = Dir.glob(ssh_dir).select do |file|
      File.file?(file) && File.readable?(file) && file.match(/id_(rsa|dsa|ecdsa|ed25519)$/)
    end
    raise "No private keys found in #{ssh_dir}" if private_key_files.empty?
    private_key_path = private_key_files.first

    raw_key = File.read(private_key_path).strip
    debug "Raw private key from #{private_key_path.yellow}:\n#{raw_key.yellow}"
    SSHData::PrivateKey.parse_openssh(raw_key).first.presence || raise("No private keys parsed from #{private_key_path}")
  end

  # Loads the public key for this machine.
  # Assumes it's in ~/.ssh and has a standard name like id_rsa.pub or id_ed25519.pub.
  # @return [String]
  def load_public_key
    public_key_files = Dir.glob(ssh_dir).select do |file|
      File.file?(file) && File.readable?(file) && file.match(/id_(rsa|dsa|ecdsa|ed25519).pub$/)
    end
    raise "No public keys found in #{ssh_dir}" if public_key_files.empty?
    public_key_path = public_key_files.first

    raw_key = File.read(public_key_path).strip
    debug "Raw public key from #{public_key_path.green}:\n#{raw_key.green}"
    # SSHData::PublicKey.parse_openssh(raw_key).presence || raise("No public keys parsed from #{public_key_path}")
    raw_key
  end

  # Loads the valid public keys on this machine from ~/.ssh/authorized_keys and any local public key files.
  # @return [Array<String>]
  def load_all_public_keys
    # read from the authorized keys file
    authorized_keys_path = File.join(ssh_dir, 'authorized_keys')
    authorized_keys = []
    if File.exist?(authorized_keys_path)
      authorized_keys = File.readlines(authorized_keys_path).map(&:strip)
      debug "Read #{authorized_keys.count} public keys from #{authorized_keys_path}"
    end

    # add the machine's own public key
    public_key = load_public_key

    [public_key.to_s] + authorized_keys
  end

  # @return [Hash] with:
  #   - :ssh_challenge [String] a timestamp string
  #   - :ssh_signature [String] the challenge string encrypted
  #   - :ssh_public_key [String] the public key used for encryption
  def generate_challenge
    get_logger.level = 'debug'

    # load the keys
    ssh_private_key = load_private_key
    ssh_public_key = load_public_key.to_s

    # generate and encrypt the challenge
    ssh_challenge = Time.now.to_i.to_s # Current UNIX timestamp
    ssh_signature = Base64.strict_encode64 ssh_private_key.sign(ssh_challenge)
    debug "Encrypted challenge #{ssh_challenge.blue} as #{ssh_signature.green}"

    {
      ssh_challenge:,
      ssh_signature:,
      ssh_public_key:
    }
  end


  # Validates that a signed challenge string is valid,
  # that the challenge timestamp is recent enough,
  # and that the public key is in the authorized keys file for this machine.
  # @return [Boolean] true if the signed challenge is valid
  def validate_challenge!(data)
    raw_key = data[:ssh_public_key].presence || raise("Must pass a ssh_public_key")
    challenge = data[:ssh_challenge].presence || raise("Must pass a ssh_challenge")
    raw_signature = data[:ssh_signature].presence || raise("Must pass a ssh_signature")
    binary_signature = Base64.decode64 raw_signature
    public_key = SSHData::PublicKey.parse_openssh raw_key
    public_key.verify challenge, binary_signature
  end

end