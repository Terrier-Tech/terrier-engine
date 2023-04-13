require 'colorize'
require 'redis'
require 'hiredis-client'

# Wraps the Clypboard Connect access tokens
class AccessToken
  include ActiveModel::Model

  attr_accessor :body, :origin, :clyp_env, :expires_at, :id, :created_at, :updated_at, :usage_count

  # @return [Boolean] true if the token hasn't expired
  def is_valid?
    # add some padding since it will take time to send the request
    self.expires_at && self.expires_at > (Time.now + 1.minute)
  end
end

# Extends `ExternApiBase` to add Clypboard Connect access token management.
class ClypboardConnectApi < ExternApiBase

  def initialize(clyp_env, connect_host)
    @clyp_env = clyp_env
    @connect_host = connect_host
    @ssh_host = connect_host.gsub('https://', '')
    @redis = Redis.new driver: :hiredis

    # use a different key for each clyp_env since some machines run more than one
    @key = "clypboard_connect_access_token-#{clyp_env}"
  end

  def api_root
    @connect_host
  end

  # overload the default behavior to get and pass a
  # valid access token along with the request
  def get_json(url, params={})
    token = current_token
    params[:clyp_env] ||= @clyp_env
    params[:token] = token.body
    super url, params
  end

  # For now, don't override post_json since we don't really care if
  # someone wants to post pings or action logs, so token authentication isn't enforced

  # @return [AccessToken] either the cached token or a new one if the cached one is invalid
  def current_token
    raw = @redis.get @key
    return fetch_token if raw.blank?
    token = AccessToken.new JSON.parse(raw)
    return fetch_token unless token.is_valid?
    info "Using cached token #{token.body.bold}"
    token
  end

  # @return [AccessToken] a new access token from the connect server
  def fetch_token
    # you can't create tokens through a public API, instead we rely on
    # being able to ssh into the connect machine to execute a rake task
    hostname = `hostname`.strip
    command = "/etc/profile.d/rvm.sh ; cd /home/tiny/clypboard-actions/current ; RAILS_ENV=production /home/tiny/.rvm/wrappers/default/bundle exec rails \"access:generate_token[#{@clyp_env},#{hostname}]\""
    info "Fetching new token from #{@ssh_host.bold} with: #{command.blue}"
    res = `ssh tiny@#{@ssh_host} bash --login -c '#{command}'`.strip
    raw = JSON.parse res
    token = AccessToken.new raw
    info "Caching new token #{token.body.bold}, expiring at #{token.expires_at.to_s.blue}"
    @redis.set @key, raw.to_json
    token
  end

  # clears the currently cached token, regardless of if it's active
  def clear_token
    @redis.set @key, nil
  end

end