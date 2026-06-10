require 'http'
require 'shellwords'

# manages SSH public keys distributed by terrier.tech
class SshKeyManager
  include Loggable

  def initialize
    @env = Rails.env&.to_s || 'development'
  end

  # how long (in seconds) to keep retrying to acquire the lock before giving up
  LOCK_TIMEOUT = 10
  # timeouts (in seconds) for the call to terrier.tech, so the request can never hang indefinitely
  HTTP_CONNECT_TIMEOUT = 5
  HTTP_READ_TIMEOUT = 15

  # updates the keys in the authorized_keys file based on the given clyp from terrier.tech
  def update_public_keys
    info "Updating public keys"

    file_path = authorized_keys_path

    # fetch the keys *before* touching the file, so the lock is only ever held for the
    # local read/compare/write, never across a (potentially slow or hung) network call
    new_keys = fetch_public_keys
    info "Found #{new_keys.count} keys"
    new_keys.each { |key| puts key }

    File.open(file_path, "r+:US-ASCII") do |file|
      # lock the file to avoid contention with other apps on the same machine editing this file simultaneously
      unless acquire_lock(file, file_path)
        info "Could not acquire lock on #{file_path} after #{LOCK_TIMEOUT}s, another process is holding it:"
        info lock_holders(file_path)
        return
      end

      # read existing keys
      existing_keys = file.read.split("\n").compact.map(&:strip).reject(&:blank?).sort
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

    # remove old backup files, keeping only the most recent ones
    clean_up_backups file_path
  end

  # computes the authorized_keys path, using a dummy location in development
  def authorized_keys_path
    if @env == 'development'
      dir = Rails.root.join('tmp/ssh').to_s
      FileUtils.mkdir_p(dir) unless File.exist?(dir)
      path = "#{dir}/authorized_keys"
      info "Using dummy authorized_keys path in development: #{path}"
    else
      path = File.expand_path "~/.ssh/authorized_keys"
      info "Using authorized_keys path: #{path}"
    end
    path
  end

  # fetches and validates the public keys from terrier.tech, with timeouts so it can't hang forever
  def fetch_public_keys
    res = HTTP.timeout(connect: HTTP_CONNECT_TIMEOUT, read: HTTP_READ_TIMEOUT)
             .get("https://terrier.tech/public_keys.json")
    raw = JSON.parse res.to_s
    unless raw['status'] == 'success'
      ap raw
      raise "Error getting public keys: #{raw['message']}"
    end
    raw['public_keys'].sort
  end

  # tries to grab an exclusive non-blocking lock, retrying for up to LOCK_TIMEOUT seconds.
  # returns true once the lock is held, or false if it couldn't be acquired in time.
  # (File#flock returns 0 on success and false when LOCK_NB would block, so we test against false explicitly.)
  def acquire_lock(file, file_path)
    deadline = Time.now + LOCK_TIMEOUT
    loop do
      return true unless file.flock(File::LOCK_EX | File::LOCK_NB) == false
      return false if Time.now >= deadline
      info "#{file_path} is locked, retrying..."
      sleep 1
    end
  end

  # returns a human-readable description of which processes currently have the file open,
  # to help diagnose whether the lock is held by a real process or is unexpectedly stale
  def lock_holders(file_path)
    out = `lsof -- #{file_path.shellescape} 2>/dev/null`.strip
    out.presence || "  (lsof reported no processes holding #{file_path} — the lock may be stale, or the filesystem (e.g. NFS) may not report locks via lsof)"
  rescue => ex
    "  (could not determine lock holders: #{ex.message})"
  end

  # number of timestamped backup files to retain
  BACKUP_RETENTION = 5

  # deletes all but the most recent BACKUP_RETENTION backup files for the given authorized_keys path
  def clean_up_backups(file_path, keep: BACKUP_RETENTION)
    # backups are named "#{file_path}_#{TIMESTAMP_FORMAT}", e.g. authorized_keys_20260610_143022
    backups = Dir.glob("#{file_path}_[0-9]*").sort
    stale = backups[0...-keep] || []
    if stale.empty?
      info "No stale backup files to clean up (#{backups.count} kept)"
      return
    end
    info "Cleaning up #{stale.count} stale backup file(s), keeping #{[backups.count, keep].min} most recent"
    stale.each do |path|
      info "Deleting old backup #{path}"
      File.delete path
    end
  end

end