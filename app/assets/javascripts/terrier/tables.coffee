window.tables = {}

_numberRegex = /^(?=.)([+-]?([0-9]*)(\.([0-9]+))?)$/g # pos/neg integer/float

################################################################################
# Sortable
################################################################################

window.tables.initSortable = (ui = $(document), col = null, dir = null) ->
	params = getUrlParams()

	col = col ? params.sortable_col
	dir = dir ? params.sortable_dir
	
	return unless col && dir
	ui.find("table.sortable th a[data-column=#{col}]").each (_, link) ->
		window.tables.sortByColLink($(link), col, dir)

# computes the sorting value using a) input values, b) data-column attributes, or c) the text of the cell
_computeCellValue = (cell) ->
# a) use input value
	if cell.is 'select'
		return cell.find('option:selected').text() # sort based on the selected option's text, not it's raw value
	if cell.is 'input'
		if cell[0].type == 'checkbox'
			return (if cell[0].checked then '0' else '1') # reverse behavior for checkboxes so that checked appear first when ascending
		val = cell.val()?.toString() || ''

	# b) use col-value or column-value data attributes
	else if typeof cell.data('column-value') != 'undefined'
		val = cell.data('column-value')
	else
		val = cell.data('col-value')

	# return float if this value is numeric (starts with numbers or decimal point)
	floatVal = parseFloat(val)
	if !_.isNaN(floatVal) && val.toString().match(_numberRegex)
		return floatVal

	# use string data value or c) use raw text
	return _blanksLast(val || cell.text())

# return a string likely to be sorted last if the value is blank
# this is crude but it seems simpler than trying to mess with the sorting logic itself
_blanksLast = (s) ->
	if s?.length
		s
	else
		Number.MAX_SAFE_INTEGER.toString()

window.tables.sortByColLink = (link, col = null, dir = null) ->
	window.setLinkLoading? link
	table = link.parents 'table'

	# need to let the loading animation start
	{ promise, resolve } = Promise.withResolvers()
	setTimeout(resolve, 5)
	await promise
	
	unless col
		col = link.data 'column'
		urls.replaceParam 'sortable_col', col
	unless dir
		descOnly = table.hasClass 'desc-only'
		dir = if descOnly or link.hasClass('asc')
			'desc'
		else
			'asc'
		urls.replaceParam 'sortable_dir', dir

	table.find('th a').removeClass('asc').removeClass('desc')
	link.addClass dir

	# sort the rows
	t = performance.now()
	rows = table.find('tbody tr').not('.always-top')
	rows.sort (a, b) ->
		aCol = $(a).find(".col-#{col}, .column-#{col}")
		aVal = _computeCellValue aCol
		bCol = $(b).find(".col-#{col}, .column-#{col}")
		bVal = _computeCellValue bCol
		comp = if aVal > bVal
			1
		else
			-1
		if dir == 'desc'
			return -comp
		comp
	console.log "Sorted rows in #{(performance.now() - t).toFixed(2)} ms"

	t = performance.now()
	alwaysTopRow = table.find('tr.always-top')
	if alwaysTopRow.length > 0
		table.find('tbody').prepend(alwaysTopRow)
	rows.detach().appendTo table.find('tbody')
	table.find('tbody tr.total').detach().appendTo table.find('tbody')
	console.log "Re-attached rows in #{(performance.now() - t).toFixed(2)} ms"
	if window.unsetLinkLoading?
		window.unsetLinkLoading link

$(document).on 'click', 'table.sortable th a[data-column]', (evt) ->
	evt.stopPropagation()
	window.tables.sortByColLink($ this)
	false
