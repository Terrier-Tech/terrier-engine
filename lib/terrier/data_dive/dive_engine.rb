class DataDive::DiveEngine
  include Loggable

  def initialize(dive, change_user)
    @dive = dive
    @change_user = change_user
  end

  def stream_run!(stream, run, params)
    data = {}

    # get the queries from the run
    input_data = run.safe_input_data
    queries = input_data['queries'] || []

    # copy the filter input values into the params
    filters = input_data['filters'] || []
    filters.each do |filter|
      info "Using filter input #{filter['input_key']} = #{filter['input_value']}"
      params[filter['input_key']] = filter['input_value']
    end

    # execute the queries and collect the results
    queries.each do |query|
      qe = QueryEngine.new query
      begin
        t = Time.now
        p = params.to_unsafe_hash
        p[:limit] = 1_000_000
        query_output = qe.execute! p
        data[qe.query.name] = query_output[:rows]
        dt = Time.now - t
        stream.write 'query_result', {
          id: qe.query.id,
          time: Time.now,
          status: 'success',
          message: "Got <strong>#{query_output[:rows].count}</strong> rows in #{(dt*1000.0).round(1)}ms"
        }
      rescue => ex
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
      if col_type.present? && col_type == 'cents'
        val = val.to_i.cents
      end
      info "Computed #{filter['input_key']} value: #{val} (#{col_type})"
      computed_inputs << {key: filter['input_key'], value: val}
    end
    data['Inputs'] = computed_inputs

    # write the output to a spreadsheet
    path = PublicTempFile.new "dive-#{@dive.name.slugify}-#{Time.now.strftime(TIMESTAMP_FORMAT)}.xlsx"
    TabularIo.save_xlsx data, path.abs_path
    info "Wrote #{@dive.name} output to #{path.abs_path}"

    # copy the output to the run
    run.output_file = File.open(path.abs_path)
    info "Output file mime type: #{run.output_file.metadata['mime_type']}"
    run.status = 'success'
    run.save_by_user! @change_user
    stream.write 'file_output', {
      name: run.output_file.metadata['filename'],
      size: run.output_file.metadata['size'],
      url: run.output_file_url
    }

  end


end