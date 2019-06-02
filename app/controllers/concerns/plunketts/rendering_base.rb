# include in all controllers
module Plunketts::RenderingBase
  extend ActiveSupport::Concern

  included do

    # renders a successful response, either in json to CSV
    # if CSV, you must pass exactly one key into data, which contains an array of hashes
    def render_success(message, data={})
      data[:status] = 'success'
      data[:message] = message
      respond_to do |format|
        format.json do
          render json: data
        end
        format.csv do
          keys = data.keys.dup
          Rails.logger.debug "--keys: #{keys}"
          keys.delete(:status)
          keys.delete(:message)
          if keys.length != 1
            return error "There must be exactly one additional argument to render_success (besides status and message) - found [#{keys.join(', ')}]"
          end
          return render text: CsvIo.write(data[keys.first])
        end
      end
    end

    def render_error(message, options={})
      @message = message
      respond_to do |format|
        format.html do
          options[:template] = 'application/error'
          render options
        end
        format.json do
          options[:status] = 'error'
          options[:message] = message
          render json: options
        end
        format.csv {render text: "error\n#{message}"}
      end
    end

    # logs the exception message and backtrace
    def log_exception(ex)
      Rails.logger.warn ex.message
      ex.backtrace[0..10].each do |line|
        Rails.logger.warn line
      end
    end

    def render_exception(ex, options={})
      log_exception ex
      @message = ex.message
      respond_to do |format|
        format.json {render json: {status: 'error', message: @message, backtrace: ex.backtrace}}
        format.csv {render text: "error\n#{@message}"}
        format.html do
          options[:template] = 'application/error'
          render options
        end
      end
    end

  end

end
