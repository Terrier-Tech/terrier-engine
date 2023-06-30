class DiveEngine
  include Loggable

  def initialize(dive)
    @dive = dive

    queries = dive.safe_query_data['queries'] || []
    @query_engines = queries.map do |query|
      QueryEngine.new query
    end
  end

  def stream_run!(stream, run, params)
    @query_engines.each do |qe|
      begin
        t = Time.now
        p = params.to_unsafe_hash
        p[:limit] = 100_000
        query_output = qe.execute! p
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
  end


end