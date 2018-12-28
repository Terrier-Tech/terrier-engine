require 'elasticsearch'

class ScriptSearchResults

  attr_accessor :ids, :took, :total, :max_score

  def initialize(raw)
    @took = raw['took']
    hits = raw['hits']
    @total = hits['total']
    @max_score = hits['max_score']
    @ids = hits['hits'].map do |hit|
      hit['_id']
    end
  end

end

class ScriptSearcher

  INDEX_NAME = "#{Rails.application.class.name.gsub('::', '_').downcase}_scripts"
  INDEX_TYPE = 'script'

  def initialize
    @client = Elasticsearch::Client.new host: 'localhost', log: true
  end

  def index(script)
    body = {
        body: script.body.split(/\s+/).join(' ')
    }
    @client.index index: INDEX_NAME, type: INDEX_TYPE, id: script.id, body: body
  end

  # removes a single script
  def unindex(script)
    @client.delete index: INDEX_NAME, type: INDEX_TYPE, id: script.id
  end

  def search(query)
    raw_query = "*#{query.strip}*"
    Rails.logger.debug "-- raw script search: #{raw_query}"
    res = @client.search index: INDEX_NAME, type: INDEX_TYPE,
                         q: raw_query, _source: false, size: 100
    ScriptSearchResults.new res
  end

end