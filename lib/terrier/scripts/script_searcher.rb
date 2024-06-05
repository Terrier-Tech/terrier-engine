class ScriptSearcher
  def search(query)
    
    query= SqlBuilder.new
      .select('body.id, t.total')
      .from("body")
      .left_join('total', 't', 'TRUE')
      .with("body AS (SELECT id FROM scripts WHERE body ILIKE '%#{ query.strip }%'),
             total AS (SELECT COUNT(*) total FROM body)")

    t = Time.now
    results = query.exec
    total= results.present? ? results.first['total'] : 0
    ids = results.present? ? results.to_a.pluck('id') : []
    dt = Time.now - t

    OpenStruct.new({
      'took' => dt,
      'ids' => ids,
      'total' => total,
    })
  end
end