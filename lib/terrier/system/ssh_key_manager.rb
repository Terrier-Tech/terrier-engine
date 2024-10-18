require 'http'

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

end