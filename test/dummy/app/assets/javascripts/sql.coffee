
$(document).on 'click', 'a.test-sql-builder', ->
	tinyModal.showDirect(
		_builderTemplate()
		{
			title: 'SQL Builder'
			title_icon: 'soup-can-outline'
			callback: initBuilder
			actions: [
				{
					title: 'Submit'
					icon: 'checkmark-round'
					class: 'submit'
				}
			]
		}
	)


_selectRowPartial = (columns, table='', prefix='') ->
	div '.horizontal-grid.select-row', ->
		div '.stretch-column', ->
			input '.columns', type: 'text', placeholder: 'Columns', value: columns
		div '.shrink-column', ->
			input '.table', type: 'text', placeholder: 'Table', value: table
		div '.shrink-column', ->
			input '.prefix', type: 'text', placeholder: 'Prefix', value: prefix

_fromRowPartial = (table, as) ->
	div '.horizontal-grid.from-row', ->
		div '.stretch-column', ->
			input '.table', type: 'text', placeholder: 'Table', value: table
		div '.shrink-column', ->
			input '.as', type: 'text', placeholder: 'As', value: as

_innerJoinRowPartial = (table, as, clause) ->
	div '.horizontal-grid.inner-join-row', ->
		div '.stretch-column', ->
			input '.table', type: 'text', placeholder: 'Table', value: table
		div '.shrink-column', ->
			input '.as', type: 'text', placeholder: 'As', value: as
		div '.shrink-column', ->
			input '.clause', type: 'text', placeholder: 'Clause', value: clause

_whereRowPartial = (clause) ->
	div '.horizontal-grid.where-row', ->
		div '.stretch-column', ->
			input '.clause', type: 'text', placeholder: 'Clause', value: clause

_orderByRowPartial = (clause) ->
	div '.horizontal-grid.order-by-row', ->
		div '.stretch-column', ->
			input '.clause', type: 'text', placeholder: 'Clause', value: clause

_builderTemplate = tinyTemplate ->
	form '.sql-builder', ->
		h4 '', 'Select'
		_selectRowPartial 'title, email_recipients', 'script', 'script_'
		_selectRowPartial 'duration, created_by_name, created_at', 'run'
		h4 '', 'From'
		_fromRowPartial 'script_runs', 'run'
		h4 '', 'Inner Join'
		_innerJoinRowPartial 'scripts', 'script', 'script.id = run.script_id'
		h4 '', 'Where'
		_whereRowPartial 'run._state = 0'
		_whereRowPartial "run.status = 'success'"
		h4 '', 'Order By'
		_orderByRowPartial 'created_at ASC'


initBuilder = (ui) ->
	ui.find('a.submit').click =>
		form = ui.find('form')
		builder = tinySql.build()
		ui.showLoadingOverlay()
		form.find('.select-row').each (index, elem) ->
			row = $ elem
			builder.select(
				row.find('input.columns').val()
				row.find('input.table').val()
				row.find('input.prefix').val()
			)
		form.find('.from-row').each (index, elem) ->
			row = $ elem
			builder.from(
				row.find('input.table').val()
				row.find('input.as').val()
			)
		form.find('.inner-join-row').each (index, elem) ->
			row = $ elem
			builder.innerJoin(
				row.find('input.table').val()
				row.find('input.as').val()
				row.find('input.clause').val()
			)
		form.find('.where-row').each (index, elem) ->
			row = $ elem
			builder.where(
				row.find('input.clause').val()
			)
		form.find('.order-by-row').each (index, elem) ->
			row = $ elem
			builder.orderBy(
				row.find('input.clause').val()
			)

		tinySql.safeExec builder, (results) ->
			ui.removeLoadingOverlay()
			puts results
			showResults results


_resultsTemplate = tinyTemplate (res) ->
	unless res.length
		table ''
		return
	table '', ->
		cols = _.keys res[0]
		thead '', ->
			tr '', ->
				for col in cols
					th '', col
		tbody '', ->
			for row in res
				tr '', ->
					for col in cols
						td '', row[col].toString()

showResults = (res) ->
	tinyModal.showDirect(
		_resultsTemplate(res)
		{
			title: 'SQL Results'
			title_icon: 'soup-can-outline'
		}
	)