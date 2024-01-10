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

# computes the sorting value using input values, data-column attributes, or the text of the cell
_computeCellValue = (cell) ->
	if cell.is 'select'
		return cell.find('option:selected').text() # sort based on the selected option's text, not it's raw value
	if cell.is 'input'
		if cell[0].type == 'checkbox'
			return cell[0].checked
		return cell.val()
	val = cell.data('col-value') || cell.data('column-value')
	if val?
		val
	else
		cell.text()

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
