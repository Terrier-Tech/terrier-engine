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
    info "Getting #{full_url}?#{params.to_param}"
    raw = HTTP.get(full_url, params: params, ssl_context: make_ssl_context)
    begin
      res = JSON.parse raw.body
    rescue => ex
      warn "raw response: #{raw.inspect}"
      raise "Error parsing json GET response: #{ex.message}"
    end
    unless res['status'] == 'success'
      warn "Raw GET response: #{raw.inspect}"
      warn "Error GETTING #{url}: #{res['message']}"
      raise res['message']
    end
    dt = Time.now - t
    info "Got #{full_url} in #{(dt * 1000).round(1)}ms"
    res
  end

  def post_json(url, params)
    t = Time.now
    raw = HTTP.post("#{api_root}#{url}", json: params, ssl_context: make_ssl_context)
    begin
      res = JSON.parse raw.to_s
    rescue => ex
      warn "raw response: #{raw.inspect}"
      raise "Error parsing json POST response: #{ex.message}"
    end
    unless res['status'] == 'success'
      warn "Raw POST response: #{raw.inspect}"
      warn "Error POSTING to #{url}: #{res['message']}"
      raise res['message']
    end
    dt = Time.now - t
    info "POSTED to #{url} in #{(dt * 1000).round(1)}ms"
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