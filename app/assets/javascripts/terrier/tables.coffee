window.tables = {}

################################################################################
# Sortable
################################################################################

window.tables.initSortable = (ui = $(document), col = null, dir = null) ->
	params = getUrlParams()
	col = if col then col else params.sortable_col
	dir = if dir then dir else params.sortable_dir
	if col && dir
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
		return cell.val()?.toString() || ''

	# b) use col-value or column-value data attributes
	if typeof cell.data('column-value') != 'undefined'
		val = cell.data('column-value')
	else
		val = cell.data('col-value')

	# return float if this value is numeric (starts with numbers or decimal point)
	floatVal = parseFloat(val)
	if !_.isNaN(floatVal)
		return floatVal

	# use string data value or c) use raw text
	return _blanksLast(val || cell.text())

# return a string likely to be sorted last if the value is blank
# this is crude but it seems simpler than trying to mess with the sorting logic itself
_blanksLast = (s) ->
	if s?.length
		s
	else
		'zzzzzzzz'

window.tables.sortByColLink = (link, col = null, dir = null) ->
	if window.setLinkLoading?
		window.setLinkLoading link
	table = link.parents 'table'
	setTimeout(# need to let the loading animation start
		->
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
			rows = table.find('tbody tr')
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
			puts "Sorted rows in #{(performance.now() - t).toFixed(2)} ms"

			t = performance.now()
			rows.detach().appendTo table.find('tbody')
			table.find('tbody tr.total').detach().appendTo table.find('tbody')
			puts "Re-attached rows in #{(performance.now() - t).toFixed(2)} ms"
			if window.unsetLinkLoading?
				window.unsetLinkLoading link
		5
	)

$(document).on 'click', 'table.sortable th a[data-column]', (evt) ->
	evt.stopPropagation()
	window.tables.sortByColLink($ this)
	false
