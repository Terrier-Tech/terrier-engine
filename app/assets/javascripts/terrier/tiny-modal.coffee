window.tinyModal = {}

# this can be overridden to customize the class of the close button icon
window.tinyModal.closeIconClass = '.la.la-close.ion-android-close'

# this can be overridden to customize the class of the icon used on error pages
window.tinyModal.alertIcon = 'alert'

# shows the overlay and applies the with-modal class to the body
showOverlay = ->
	$('body').addClass 'with-modal'
	overlay = $ '#modal-overlay'
	unless overlay.length
		$('<div id="modal-overlay"></div>').appendTo 'body'

removeOverlay = ->
	$('body').removeClass 'with-modal'
	$('#modal-overlay').remove()


# this shouldn't generally be called directly, use tinyModal.pop() instead
window.tinyModal.close = ->
	removeOverlay()

	win = $('#modal-window')
	if win.length
		win.removeClass 'show'
		if win.find('.modal-reload').length
			Turbolinks.visit window.location
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

	# ensure the window isn't taller than the document
	docHeight = $('#modal-overlay').height()
	maxHeight = docHeight - 48 # take $modal-pad into account
	row.parents('#modal-window').css 'max-height', "#{maxHeight}px"
	row.find('.modal-column').css 'max-height', "#{maxHeight}px"

	# ensure that each column isn't wider than the window
	row.children('.modal-column').css 'max-width', $('#modal-window').width()


_classToSel = (c) ->
	unless c?
		return ''
	_.map(c.split(/\s+/), (s) -> ".#{s}").join('')

_actionPartial = (action) ->
	sel = '.action'
	if action.icon?.length
		sel += '.with-icon'
	a "#{sel}#{_classToSel(action.class)}", action.attrs||{}, ->
		if action.icon?.length
			icon ".ion-#{action.icon}.la.la-#{action.icon}"
		span '.title', action.title

_template = tinyTemplate (options, content) ->
	div '.modal-header', ->
		a '.close-modal', ->
			icon tinyModal.closeIconClass
		h2 '.with-icon', ->
			icon ".la.la-#{options.title_icon}.ion-#{options.title_icon}"
			span '', options.title
	div '.modal-content', content
	if options.actions?
		div '.modal-actions', ->
			for action in _.filter(options.actions, (a) -> !a.end)
				_actionPartial(action)
			div '.end', ->
				for action in _.filter(options.actions, (a) -> a.end)
					_actionPartial(action)

window.tinyModal.template = _template


_emptyColumnTemplate = tinyTemplate ->
	div '.modal-column', ->
		div '.modal-header'
		div '.modal-content'
		div '.modal-actions'


# replaces the content of the top modal on the stack
window.tinyModal.replaceContent = (content)	->
	$('#modal-window .modal-content:last').html content

# expands the modal window to take up the whole width
window.tinyModal.expand = ->
	win = $('#modal-window')
	win.css width: '96%'
	_layoutRow win.children('#modal-row')


# shows a modal with direct content
window.tinyModal.showDirect = (content, options={}) ->
	showOverlay()

	# window
	win = $ '#modal-window'
	unless win.length
		win = $('<div id="modal-window"><div id="modal-row"></div></div>').appendTo 'body'
	win.toggleClass 'tiny', (options.tiny || false)

	# row
	row = win.find '#modal-row'

	# render content
	unless options.layout?
		options.layout = true
	fullContent = if options.layout
		_template(options, content)
	else
		content

	# column
	column = $("<div class='modal-column'>#{fullContent}</div>").appendTo row

	_layoutRow row

	setTimeout(
		->
			win.addClass 'show'
			column.find('input:not([type=hidden]):first').focus()
			if options.callback?
				options.callback column
		10
	)

# allows applications to modify the URL before making the modal request
window.tinyModal.modifyUrl = (url) ->
	url


# populate the modal from a URL
window.tinyModal.show = (url, options={}) ->
	showOverlay()

	# add the modal parameter to the link
	if url.indexOf('?')>-1
		url += '&modal=true'
	else
		url += '?modal=true'

	# custom modifications to the URL
	url = window.tinyModal.modifyUrl url

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
			else
				column.find('input:not([type=hidden]):first').focus()
				if options.callback?
					options.callback column
	)

	setTimeout(
		->
			win.addClass 'show'
		10
	)


$(document).on 'click', 'a.modal', (evt) ->
	link = $ evt.currentTarget
	href = link.attr 'href'
	options = {}
	options.tiny = link.hasClass('tiny-modal')
	window.tinyModal.show href, options
	evt.stopPropagation()
	false

$(document).on 'click', 'a.close-modal', ->
	modal = $ '#modal-window'
	window.tinyModal.pop()
	if modal.find('.reload-modal').length or modal.find('form.streaming').length
		Turbolinks.visit location.href


# handle modal form errors
# this currently breaks some clypboard forms
#$(document).on 'ajax:error', '#modal-window form', (xhr, status, error) ->
#	win = $ '#modal-window'
#	column = win.find '.modal-column'
#	column.html _template({title: 'Error', title_icon: tinyModal.alertIcon}, "<pre class='error-body'>#{status.responseText}</pre>")
#	tinyModal.removeLoadingOverlay()


################################################################################
# Alerts
################################################################################

_alertTemplate = tinyTemplate (options) ->
	div '#modal-alert', ->
		div '.title', options.title || 'No Title'
		if options.body?.length
			div '.body', options.body
		div '.actions', ->
			i = 0
			for action in options.actions
				classes = tinyTemplate.parseClasses action.classes
				classes.push 'action'
				classes.push 'button'
				classes.push "action-#{i}"
				if action.icon?.length
					classes.push action.icon
				a tinyTemplate.classesToSelector(classes), href: action.href, action.title||'No title'
				i += 1


# Shows a modal alert with optionol actions
# options can container:
# - title
# - body
# - actions (array)
# Each action can contain:
# - title
# - href
# - icon
# - classes
# - callback
# Add an action with the close class to close the alert.
# If none is provided, one will automatically be inserted.
tinyModal.showAlert = (options) ->
	showOverlay()

	$('#modal-alert').remove()

	options.actions ||= []
	hasClose = false
	for action in options.actions
		classes = tinyTemplate.parseClasses action.classes
		if classes.includes 'close'
			hasClose = true
			break
	unless hasClose
		options.actions.push {
			title: 'Close'
			classes: 'close'
			icon: 'ion-close-round'
		}

	ui = $(_alertTemplate(options)).appendTo 'body'

	ui.find('a.close').click -> tinyModal.closeAlert()

	for i in [0..options.actions.length-1]
		action = options.actions[i]
		if action.callback?
			ui.find(".action-#{i}").click action.callback

	setTimeout(
		->
			ui.addClass 'show'
		10
	)

tinyModal.closeAlert = ->
	unless $('modal-window').hasClass('show')
		removeOverlay()
	ui = $ '#modal-alert'
	ui.removeClass 'show'
	setTimeout(
		-> ui.remove()
		500
	)

# Shows an alert modal pre-populated with an Okay and Cancel action.
# The Okay action calls the callback while the Cancel action just closes the alert.
tinyModal.confirmAlert = (title, body, callback) ->
	options = {
		title: title
		body: body
	}
	options.actions = [
		{
			title: 'Okay'
			classes: 'primary'
			callback: callback
			icon: 'ion-checkmark-round'
		}
		{
			title: 'Cancel'
			classes: 'cancel close'
			icon: 'ion-close-round'
		}
	]
	tinyModal.showAlert options

# Shows an alert modal pre-populated with an Okay action.
# The Okay action just closes the alert.
# Optionally, the action attributes can be overridden with the action argument.
tinyModal.noticeAlert = (title, body, action={}) ->
	options = {
		title: title
		body: body
	}
	okayAction = {title: 'No Title', icon: 'ion-checkmark-round'}
	okayAction = Object.assign okayAction, action
	okayAction.classes ||= 'close'
	classes = tinyTemplate.parseClasses okayAction.classes
	unless classes.includes('close')
		classes.push 'close'
		okayAction.classes = classes
	options.actions = [okayAction]
	tinyModal.showAlert options
