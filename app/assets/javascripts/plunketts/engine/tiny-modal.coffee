window.tinyModal = {}

# this can be overridden to customize the class of the close button icon
window.tinyModal.closeIconClass = '.la.la-close.ion-android-close'

# this can be overridden to customize the class of the icon used on error pages
window.tinyModal.alertIcon = 'alert'

# this shouldn't generally be called directly, use tinyModal.pop() instead
window.tinyModal.close = ->
	$('body').removeClass 'with-modal'
	$('#modal-overlay').remove()

	win = $('#modal-window')
	if win.length
		win.removeClass 'show'
		setTimeout(
			-> win.remove()
			500
		)

window.tinyModal.pop = ->
	row = $('#modal-row')
	if row.children('.modal-column').length > 1
		row.children('.modal-column:last').remove()
		_layoutRow row
		tinyModal.removeLoadingOverlay()
	else
		tinyModal.close()

window.tinyModal.getStackSize = ->
	$('#modal-row .modal-column').length


window.tinyModal.removeLoadingOverlay = ->
	$('#modal-window').find('.loading-overlay').remove()


_layoutRow = (row) ->
	# ensure the row is large enough to fit all columns and that the last one is showing
	numColumns = row.children('.modal-column').length
	row.css {width: "#{numColumns*100}%", left: "-#{(numColumns-1)*100}%"}

	# ensure the window isn't larger than the document
	docHeight = $('#modal-overlay').height()
	maxHeight = docHeight - 48 # take $modal-pad into account
	row.parents('#modal-window').css 'max-height', "#{maxHeight}px"
	row.find('.modal-column').css 'max-height', "#{maxHeight}px"


_template = tinyTemplate (options, content) ->
	div '.modal-header', ->
		a '.close-modal', ->
			icon tinyModal.closeIconClass
		h2 '.with-icon', ->
			icon ".la.la-#{options.title_icon}.ion-#{options.title_icon}"
			span '', options.title
	div '.modal-content', content

_emptyColumnTemplate = tinyTemplate ->
	div '.modal-column', ->
		div '.modal-header'
		div '.modal-content'
		div '.modal-actions'



# shows a modal with direct content
window.tinyModal.showDirect = (content, options={}) ->
	$('body').addClass 'with-modal'

	# overlay
	overlay = $ '#modal-overlay'
	unless overlay.length
		overlay = $('<div id="modal-overlay"></div>').appendTo 'body'

	# window
	win = $ '#modal-window'
	unless win.length
		win = $('<div id="modal-window"><div id="modal-row"></div></div>').appendTo 'body'
	win.toggleClass 'tiny', (options.tiny || false)

	# row
	row = win.find '#modal-row'

	# column
	column = $("<div class='modal-column'>#{_template(options, content)}</div>").appendTo row

	setTimeout(
		->
			win.addClass 'show'
			if options.callback?
				options.callback column
		10
	)

# populate the modal from a URL
window.tinyModal.show = (url, options) ->
	$('body').addClass 'with-modal'

	# add the modal parameter to the link
	if url.indexOf('?')>-1
		url += '&modal=true'
	else
		url += '?modal=true'

	# overlay
	overlay = $ '#modal-overlay'
	unless overlay.length
		overlay = $('<div id="modal-overlay"></div>').appendTo 'body'

	# window
	win = $ '#modal-window'
	unless win.length
		win = $('<div id="modal-window"><div id="modal-row"></div></div>').appendTo 'body'
	win.toggleClass 'tiny', (options.tiny || false)

	# row
	row = win.find '#modal-row'

	# create the column
	column = $(_emptyColumnTemplate()).appendTo row

	_layoutRow row

	column.load(
		url
		(res, status, xhr) ->
			if status == 'error'
				column.html _template({title: 'Error', title_icon: tinyModal.alertIcon}, "<pre class='error-body'>#{res}</pre>")
				tinyModal.removeLoadingOverlay()
			else if options.callback?
				options.callback column
	)

	setTimeout(
		->
			win.addClass 'show'
		10
	)


$(document).on 'click', 'a.modal', ->
	link = $ this
	href = link.attr 'href'
	options = {}
	options.tiny = link.hasClass('tiny-modal')
	window.tinyModal.show href, options
	false

$(document).on 'click', 'a.close-modal', ->
	modal = $ '#modal-window'
	window.tinyModal.pop()
	if modal.find('.reload-modal').length or modal.find('form.streaming').length
		Turbolinks.visit location.href


# handle modal form errors
$(document).on 'ajax:error', '#modal-window form', (xhr, status, error) ->
	win = $ '#modal-window'
	column = win.find '.modal-column'
	column.html _template({title: 'Error', title_icon: tinyModal.alertIcon}, "<pre class='error-body'>#{status.responseText}</pre>")
	tinyModal.removeLoadingOverlay()
