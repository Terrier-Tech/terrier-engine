class DataDive::DiveEngine
  include Loggable

  def initialize(dive, change_user)
    @dive = dive
    @change_user = change_user
  end

  # Run the dive and stream the results to the client.
  # @param stream [ResponseStreamer]
  # @param run [DdDiveRun]
  # @param params [Hash] hopefully contains the input values
  def stream_run!(stream, run, params)
    data = {}

    # get the queries from the run
    input_data = run.safe_input_data
    queries = input_data['queries'] || []

    # estimate the number of steps that will be streamed
    # 3 steps per query + 1 for creating the run and 1 for writing the file
    total_steps = queries.count * 3 + 2
    stream.write 'init_run', {total_steps: total_steps}

    # copy the filter input values into the params
    filters = input_data['filters'] || []
    filters.each do |filter|
      info "Using filter input #{filter['input_key']} = #{filter['input_value']}"
      params[filter['input_key']] = filter['input_value']
    end

    # execute the queries and collect the results
    queries.each do |query|
      qe = DataDive::QueryEngine.new query
      begin

        # execute the query
        t = Time.now
        p = params.to_unsafe_hash
        p[:limit] = 1_000_000
        query_output = qe.execute! p
        rows = query_output[:rows]
        columns = query_output[:columns]
        column_map = columns.index_by{|col| col[:select_name]}
        dt_exec = Time.now - t
        stream.info "Executed '#{query['name']}' in #{dt_exec.to_ms}ms"

        # format the output using the column metadata
        t = Time.now
        rows.each do |row|
          row.each do |key, val|
            col = column_map[key]
            row[key] = format_value val, col[:type]
          end
        end
        dt_format = Time.now - t
        stream.info "Formatted values for '#{query['name']}' in #{dt_format.to_ms}ms"

        data[qe.query.name] = rows
        dt = dt_exec + dt_format
        stream.write 'query_result', {
          id: qe.query.id,
          time: Time.now,
          status: 'success',
          message: "Got <strong>#{query_output[:rows].count.to_delimited}</strong> rows in #{dt.seconds}"
        }
      rescue => ex
        error ex
        stream.write 'query_result', {
          id: qe.query.id,
          time: Time.now,
          status: 'error',
          message: ex.message
        }
      end
    end

    # get the computed filter inputs back from the params
    computed_inputs = []
    filters.each do |filter|
      val = params[filter['input_key']]
      col_type = filter['column_type']
      val = format_value val, col_type
      info "Computed #{filter['input_key']} value: #{val} (#{col_type})"
      computed_inputs << {key: filter['input_key'], value: val}
    end
    data['Inputs'] = computed_inputs

    # write the output to a spreadsheet
    t = Time.now
    path = PublicTempFile.new "dive-#{@dive.name.slugify}-#{Time.now.strftime(TIMESTAMP_FORMAT)}.xlsx"
    TabularIo.save_xlsx data, path.abs_path
    dt_save = Time.now - t
    stream.info "Wrote #{@dive.name} output to #{path.abs_path} in #{dt_save.to_ms}ms"

    # copy the output to the run
    run.output_file = File.open(path.abs_path)
    run.status = 'success'
    run.save_by_user! @change_user
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
      val.to_i.cents
    else
      val.to_s
    end
  end


end