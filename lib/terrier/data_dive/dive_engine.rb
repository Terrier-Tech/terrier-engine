class DiveEngine
  include Loggable

  def initialize(dive, change_user)
    @dive = dive
    @change_user = change_user

    queries = dive.safe_query_data['queries'] || []
    @query_engines = queries.map do |query|
      QueryEngine.new query
    end
  end

  def stream_run!(stream, run, params)
    data = {}

    # execute the queries and collect the results
    @query_engines.each do |qe|
      begin
        t = Time.now
        p = params.to_unsafe_hash
        p[:limit] = 100_000
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