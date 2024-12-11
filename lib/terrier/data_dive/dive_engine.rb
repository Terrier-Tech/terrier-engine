class DataDive::DiveEngine
  include Loggable

  def initialize(dive, change_user)
    @dive = dive
    @change_user = change_user
    @stream = nil
  end

  # Run the dive
  # @param run [DdDiveRun]
  # @param params [Hash] hopefully contains the input values
  # @return [DdDiveRun]
  def run!(run, params)
    data = {}
    query_data = []

    params = params.to_unsafe_hash if params.is_a?(ActionController::Parameters)

    # get the queries from the run
    # allow the queries to be specified in the run if we're running unpersisted dive changes
    input_data = run.safe_input_data
    queries = input_data['queries'] || @dive.safe_query_data['queries']

    # estimate the number of steps that will be streamed
    # 3 steps per query + 1 for creating the run and 1 for writing the file
    total_steps = queries.count * 3 + 2
    @stream&.write 'init_run', { total_steps: total_steps }

    # copy the filter input values into the params
    filters = input_data['filters'] || []
    filters.each do |filter|
      info "Using filter input #{filter['id']} = #{filter['input_value']}"
      params[filter['id']] = filter['input_value']
    end
    actual_filters = []

    # execute the queries and collect the results
    queries.each do |query|
      qe = DataDive::QueryEngine.new query
      qd = query.dup
      query_data << qd
      begin

        # execute the query
        t = Time.now
        params[:limit] = 1_000_000
        query_output = qe.execute! params
        rows = query_output[:rows]
        columns = query_output[:columns]
        column_map = columns.index_by { |col| col[:select_name] }
        dt_exec = Time.now - t
        info "Executed '#{query['name']}' in #{dt_exec.to_ms}ms"

        # collect the filters for output
        actual_filters += qe.filters.map do |filter|
          filter.query = qe.query
          filter
        end

        # format the output using the column metadata
        t = Time.now
        rows.each do |row|
          row.each do |key, val|
            col = column_map[key]
            row[key] = format_value val, col[:type]
          end
        end
        dt_format = Time.now - t
        info "Formatted values for '#{query['name']}' in #{dt_format.to_ms}ms"

        # store some facts about the query's run
        qd['exec_time'] = dt_format + dt_exec
        qd['count'] = rows.count

        # remove invalid sheet name characters and limit to 31 chars
        sheet_name = qe.query.name.gsub(/[\\\/\?\*\[\]]/, "_").slice(0, 31)
        data[sheet_name] = rows
        dt = dt_exec + dt_format
        @stream&.write 'query_result', {
          id: qe.query.id,
          time: Time.now,
          status: 'success',
          message: "Got <strong>#{query_output[:rows].count.to_delimited}</strong> rows in #{dt.seconds_s}"
        }
      rescue => ex
        error ex
        qd['error'] = ex.message
        qd['backtrace'] = ex.backtrace
        @stream&.write 'query_result', {
          id: qe.query.id,
          time: Time.now,
          status: 'error',
          message: ex.message
        }
      end
    end

    # get the computed filter inputs back from the params
    computed_inputs = []
    actual_filters.each do |filter|
      val = params[filter.id]
      col_type = filter.column_type
      val = format_value val, col_type
      info "Computed #{filter.input_name} value: #{val} (#{col_type})"
      computed_inputs << {query: filter.query&.name, name: filter.input_name, value: val }
    end
    data['Inputs'] = computed_inputs

    # write the output to a spreadsheet
    t = Time.now
    path = PublicTempFile.new "dive-#{@dive.name.slugify}-#{Time.now.strftime(TIMESTAMP_FORMAT)}.xlsx"
    TabularIo.save_xlsx data, path.abs_path
    dt_save = Time.now - t
    info "Wrote #{@dive.name} output to #{path.abs_path} in #{dt_save.to_ms}ms"

    # copy the output to the run
    run.output_file = File.open(path.abs_path)
    run.status = 'success'

    # write some data to the output
    run.output_data = {
      queries: query_data
    }

    run.save_by_user! @change_user

    run
  end

  # Run the dive and stream the results to the client.
  # @param stream [ResponseStreamer]
  # @param run [DdDiveRun]
  # @param params [Hash] hopefully contains the input values
  def stream_run!(stream, run, params)
    @stream = stream

    run! run, params

    stream.write 'file_output', {
      name: run.output_file.metadata['filename'],
      size: run.output_file.metadata['size'],
      url: run.output_file_url
    }
  end

  # formats a raw value for output based on the column type
  def format_value(val, type)
    return val.to_s unless type.present?
    case type
    when 'cents'
      val.to_i / 100.0
    else
      val.to_s
    end
  end


end