require 'http'
require 'terrier/logging/loggable'
require 'colorize'

# provides common methods for interfacing with external APIs using HTTP
class ExternApiBase
  include Loggable

  def api_root
    raise "Subclasses must provide an api_root"
  end

  def get_json(url, params)
    t = Time.now
    url = url[1..-1] if url.start_with?('/')
    full_url = "#{api_root}/#{url}"
    info "Getting #{full_url.bold}?#{params.to_param.italic}"
    raw = HTTP.get(full_url, params: params, ssl_context: make_ssl_context)
    begin
      res = JSON.parse raw.body
    rescue => ex
      warn "raw response: #{raw.inspect.red}"
      raise "Error parsing json GET response: #{ex.message.red}"
    end
    unless res['status'] == 'success'
      warn "Raw GET response: #{raw.inspect.red}"
      warn "Error GETTING #{url.bold}: #{res['message']&.red}"
      raise res['message']
    end
    dt = Time.now - t
    dt_s = "#{(dt * 1000).round(1)}ms"
    info "Got #{full_url.bold} in #{dt_s.blue}"
    res
  end

  def post_json(url, params)
    t = Time.now
    full_url = "#{api_root}/#{url}"
    info "Posting to #{full_url.bold} with params #{params.inspect.italic}"
    raw = HTTP.post(full_url, json: params, ssl_context: make_ssl_context)
    begin
      res = JSON.parse raw.to_s
    rescue => ex
      warn "raw response: #{raw.inspect.red}"
      raise "Error parsing json POST response: #{ex.message.red}"
    end
    unless res['status'] == 'success'
      warn "Raw POST response: #{raw.inspect.red}"
      warn "Error POSTING to #{url}: #{res['message']&.red}"
      raise res['message']
    end
    dt = Time.now - t
    dt_s = "#{(dt * 1000).round(1)}ms"
    info "POSTED to #{url} in #{dt_s.blue}"
    res
  end

  # we need to disable SSL verification in dev because we're trying to connect to puma-dev
  # which has an untrusted CA
  def make_ssl_context
    ctx = OpenSSL::SSL::SSLContext.new
    if Rails.env.development?
      ctx.verify_mode = OpenSSL::SSL::VERIFY_NONE
    end
    ctx
  end

end