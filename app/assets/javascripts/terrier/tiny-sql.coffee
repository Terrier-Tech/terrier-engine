window.tinySql = {}


window.tinySql.build = ->
	new SqlBuilder()


class SqlBuilder
	constructor: ->
		@froms = []
		@selects = []
		@filters = []
		@joins = []
		@groupBys = []
		@orderBys = []
		@havings = []
		@theLimit = 10000

	from: (table, as=null) ->
		if as?.length
			@froms.push "#{table} #{as}"
		else
			@froms.push table
		this

	select: (columns, table=null, prefix=null) ->
		if typeof columns is 'string'
			columns = _.map columns.split(','), (c) -> c.trim()
		tablePart = if table then "#{table}." else ''
		for c in columns
			statement = "#{tablePart}#{c}"
			if prefix?.length
				statement += " #{prefix}#{c}"
			@selects.push statement
		this

	innerJoin: (table, as, clause) ->
		@joins.push "INNER JOIN #{table} AS #{as} ON #{clause}"
		this

	where: (clause) ->
		@clauses.push clause
		this

	groupBy: (expression) ->
		@groupBys.push expression
		this

	orderBy: (expression) ->
		@orderBys.push expression
		this

	having: (clause) ->
		@havings.push clause
		this

	limit: (limit) ->
		@theLimit = limit
		this

	serialize: ->
		{
			froms: @froms
			selects: @selects
			clauses: @clauses
			joins: @joins
			group_bys: @groupBys
			order_bys: @orderBys
			havings: @havings
			the_limit: @theLimit
		}


window.tinySql.exec = (builder, callback) ->
	query = builder.serialize()
	puts query
	$.post(
		"/sql/exec"
		{
			query: query
		}
		callback
	)

window.tinySql.safeExec = (builder, callback) ->
	tinySql.exec builder, (res) ->
		if res.status == 'success'
			callback res.result
		else
			window.removeLoadingOverlays?()
			alert res.message
