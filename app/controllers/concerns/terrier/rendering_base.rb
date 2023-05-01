# include in all controllers
module Terrier::RenderingBase
  extend ActiveSupport::Concern

  included do

    ## Rendering

    def init_request_time
      @request_start_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    end

    before_action :init_request_time

    # renders a successful response, either in json to CSV
    # if CSV, you must pass exactly one key into data, which contains an array of hashes
    def render_success(message, data={})
      data[:status] = 'success'
      data[:message] = message
      data[:exec_time] = Process.clock_gettime(Process::CLOCK_MONOTONIC) - @request_start_time
      respond_to do |format|
        format.json do
          render json: data
        end
        format.csv do
          keys = data.keys.dup
          Rails.logger.debug "--keys: #{keys}"
          keys.delete(:status)
          keys.delete(:message)
          keys.delete(:exec_time)
          if keys.length != 1
            return error "There must be exactly one additional argument to render_success (besides status and message) - found [#{keys.join(', ')}]"
          end
          return render plain: TabularIo.serialize_csv(data[keys.first])
        end
        format.html do
          if params[:modal]&.is_true?
            data[:layout] ||= 'modal'
          end
          render data
        end
      end
    end

    # sick of passing empty messages
    def render_api_success(data)
      render_success '', data
    end

    def render_error(message, options={})
      @message = message
      respond_to do |format|
        format.html do
          options[:template] = 'application/error'
          if params[:modal]&.is_true?
            options[:layout] ||= 'modal'
          end
          render options
        end
        format.json do
          options[:status] = 'error'
          options[:message] = message
          render json: options
        end
        format.csv {render plain: "error\n#{message}"}
      end
    end

    # logs the exception message and backtrace
    # options can contain `full: true` to log the entire backtrace instead of just the first part
    def log_exception(ex, options={})
      Rails.logger.warn ex.message
      lines = options[:full].is_true? ? ex.backtrace : ex.backtrace[0..16]
      lines.filter_backtrace.each do |line|
        Rails.logger.warn line
      end
    end

    def render_exception(ex, options={})
      log_exception ex, options
      @message = ex.message
      @backtrace = ex.backtrace
      respond_to do |format|
        format.json {render json: {status: 'error', message: @message, backtrace: ex.backtrace}}
        format.csv {render plain: "error\n#{@message}"}
        format.html do
          options[:template] = 'application/error'
          render options
        end
        format.svg do
          render plain: "<svg width='640px' height='640px' viewBox='0 0 640 640' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'>" +
            "<text fill='red' x='20' y='20'>#{@message}</text></svg>"

        end
      end
    end

  end


  ## Params

  def required_param(name)
    val = params[name]
    if val.blank?
      raise "Missing required parameter '#{name}'"
    end
    val
  end

  def form_params(name)
    params[name.to_sym].permit!
  end

  def true_param?(name)
    params[name] && params[name].downcase == 'true'
  end

  def array_param(name)
    value = params[name]
    if value.is_a? Hash
      return value.values
    end
    if value.is_a? Array
      return value
    end
    if value.is_a? String
      return value.split(',')
    end
    value.to_h.values
  end

  def required_array_param(name)
    value = array_param(name)
    if value.blank?
      raise "Must provide non-empty #{name} parameter"
    end
    value
  end

  # @return A new URL string based on the current one except with the new params set
  def change_url_params(url, new_params)
    uri = URI.parse url
    query = Rack::Utils.parse_query uri.query
    query.merge! new_params
    uri.query = Rack::Utils.build_query query
    uri.to_s
  end

end
