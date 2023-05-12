require 'terrier/frontend/model_generator'

# Provides a generic interface over any database model.
# For use with modern frontend code.
class DbController < ApplicationController
  include Terrier::TerrierAuth

  skip_before_action :verify_authenticity_token

  def get_model
    query = get_query

    json_opts = {}
    p = get_params

    # limit
    limit = p[:limit].to_i
    if limit > 0
      query = query.limit limit
    end

    # includes
    includes = p[:includes]
    if includes.present?
      query = query.includes includes

      json_opts[:include] = ar_to_json_includes includes
    end

    # order
    order = p[:order]
    if order.present?
      query = query.order(order)
    end

    render_api_success records: query.as_json(json_opts) || []
  end

  def count_model
    query = get_query

    count = query.count
    render_success '', count: count
  end

  def upsert_model
    model_name = required_param :model
    model = model_name.classify.constantize
    attrs = required_param(:record).to_unsafe_h
    includes = params[:includes]&.to_unsafe_h || {}

    changed_attachment_cols = [] # keep track of which attachments changed so we can update their derivatives later
    if defined? Shrine
      attachment_cols = model.ancestors.grep(Shrine::Attachment).map(&:attachment_name)
      attachment_cols.each do |name|
        name = name.to_s
        db_col = "#{name}_data"
        # we store the path to the tmp file in the column that should hold the binary json data
        # read the file into the virtual attachment column provided by shrine
        # if the path is nil, the attachment isn't being changed in this update.
        file_path = attrs.dig(db_col, 'path')
        if file_path.present?
          attrs[name] = File.open(file_path, 'r')
          attrs.delete db_col
          changed_attachment_cols << name
        else
          # if we're not changing the attachment, delete any empty FileList data sent from the client
          attrs.delete name
        end
      end
    end

    record = nil
    begin
      model.transaction do
        record = model.upsert! attrs, _terrier_change_user, includes

        # create the attachment derivatives
        changed_attachment_cols.each { |col| record.send("#{col}_derivatives!") }
        record.save_by_user! _terrier_change_user
      end
      render_api_success record: record.as_json(include: ar_to_json_includes(includes)), errors: {}
    rescue => ex
      log_exception ex
      record ||= attrs # make sure there's something to return
      errors = ApplicationRecord.safe_record_errors(ex, record)
      render_error ex.message, record: record, errors: errors, backtrace: ex.backtrace
    end
  end

  def schema
    generator = ModelGenerator.new
    schema = generator.raw_schema
    render_api_success schema: schema
  end


  private

  def get_params
    params.to_unsafe_h
  end

  # computes and returns the query based on the params,
  # but doesn't execute it
  def get_query

    model_name = required_param :model
    model = model_name.classify.constantize
    query = model.all
    p = get_params

    # add the where clauses
    where_maps = p[:where_maps].presence || []
    where_maps.each do |map|
      query = query.where map
    end
    where_clauses = p[:where_clauses] || []
    where_clauses.each do |wc|
      query = query.where wc['clause'], *(wc['args'] || [])
    end

    # add joins
    joins = p[:joins].presence || []
    joins.each do |join|
      query = query.joins join.to_sym
    end

    query
  end

  # as_json needs includes to each contain an :include key
  def ar_to_json_includes(inc_in)
    inc_out = {}
    inc_in.each do |k, v|
      if v.empty?
        inc_out[k] = {}
      else
        inc_out[k] = {
          include: ar_to_json_includes(v)
        }
      end
    end
    inc_out
  end

end