module Terrier::FullTextSearch
  extend ActiveSupport::Concern

  class_methods do
	# sample query
	# SELECT id, display_name, ts_rank(to_tsvector('english', display_name),to_tsquery('english', 'Target&Express'))
	# FROM locations
	# WHERE display_name @@ to_tsquery('english', 'Target & Express')
	# ORDER BY ts_rank(to_tsvector('english', display_name),to_tsquery('english', 'Target&Express')) DESC;
    def can_full_text_search(col_name)
      table_sql_name = self.name.underscore.pluralize
      define_singleton_method "#{col_name}_full_text_search" do |plain_text|
        # check for index on column
        index_query = SqlBuilder.new
          .select('*')
          .from('pg_indexes')
          .where("schemaname = 'public'")
          .where("indexname = 'index_#{table_sql_name}_on_#{col_name}'")
        if index_query.exec.to_a.count == 0
          Rails.logger.warn "WARNING: no index for #{col_name} in table #{table_sql_name}: Create new migration file with 'add_index :#{table_sql_name}, :#{col_name}'"
        end
        # do actualy query
        query_text = plain_text.to_s.strip.squeeze(' ')
        sql_where = "#{col_name} @@ plainto_tsquery('english', '#{query_text}')"
		sql_order = "ts_rank(to_tsvector('english', #{col_name}), to_tsquery('english', '#{query_text}')) DESC"
        self.where(sql_where).order(sql_order)
      end
    end
  end
end