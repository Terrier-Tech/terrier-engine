window.tinyModal = {}
window.tinyModal.async ||= {}

# this can be overridden to customize the class of the close button icon
window.tinyModal.closeIconClass = '.glyp-close'

# this can be overridden to customize the class of the icon used on error pages
window.tinyModal.alertIcon = 'alert'

# callbacks associated with modal columns, to be executed upon tinyModal.pop()
window.tinyModal.customCallbacks = {
	onPop: {},
	onShow: {}
}

clearCallbacks = ->
	tinyModal.customCallbacks.onPop = {}
	tinyModal.customCallbacks.onShow = {}

addCallbacks = (options, column) ->
	key = new Date().getTime()
	if options.onShow?
		column.data('column-callback-id', key)
		tinyModal.customCallbacks.onShow[key] = options.onShow
	if options.onPop?
		column.data('column-callback-id', key)
		tinyModal.customCallbacks.onPop[key] = options.onPop

# can be overridden to return some HTML that will be shown while the modal is loading
window.tinyModal.renderLoader = (url, options) ->
	null

# some amount of time to allow the content to load before showing the loader
window.tinyModal.loaderDelay = 250

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
	clearCallbacks()
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

	poppedColumn = row.children('.modal-column:last')
	poppedColumnCallbackId = poppedColumn.data('column-callback-id')
	delete tinyModal.customCallbacks.onShow[poppedColumnCallbackId]
	if tinyModal.customCallbacks.onPop[poppedColumnCallbackId]?
		tinyModal.customCallbacks.onPop[poppedColumnCallbackId] poppedColumn
		delete tinyModal.customCallbacks.onPop[poppedColumnCallbackId]

	if row.children('.modal-column').length > 1
		poppedColumn.remove()

		_layoutRow row
		column = row.children('.modal-column:last')

		# reload the current column from a name=modal-src hidden input
		# or execute the callback associated with the column
		srcField = column.find('input[name=modal-src]')
		columnCallbackId = column.data('column-callback-id')
		if srcField.length
			url = tinyModal.ensureModalUrl srcField.val()
			column.load url, ->
				tinyModal.removeLoadingOverlay()
		else
			if tinyModal.customCallbacks.onShow[columnCallbackId]?
				tinyModal.customCallbacks.onShow[columnCallbackId] column

			tinyModal.removeLoadingOverlay()
	else
		tinyModal.close()

window.tinyModal.getStackSize = ->
	$('#modal-row .modal-column').length

# Pops the tinyModal stack until the specified level is reached.
# This calls tinyModal.pop(), so the pop callbacks will be called for each layer being removed.
window.tinyModal.popTo = (level) ->
	while tinyModal.getStackSize() > level
		tinyModal.pop()


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
	if $('#modal-window').hasClass('expanded')
		row.children('.modal-column').css 'max-width', '96vw'
	else
		row.children('.modal-column').css 'max-width', '94vw'

_actionPartial = (action) ->
	sel = '.action'
	if action.icon?.length
		sel += '.with-icon'
	if action._index?
		sel += ".action-#{action._index}"
	a "#{sel}#{tinyTemplate.classesToSelector(action.class)}", action.attrs||{}, ->
		if action.icon?.length
			icon ".la.la-#{action.icon}.#{action.icon}"
		span '.title', action.title

_template = tinyTemplate (options, content) ->
	headerClass = ['modal-header']
	if options.headerClass?.length
		headerClass = headerClass.concat tinyTemplate.parseClasses(options.headerClass)
	div tinyTemplate.classesToSelector(headerClass), ->
		h2 '.with-icon', ->
			i = options.title_icon || options.icon
			if i?.length
				icon ".la.la-#{i}.#{i}"
			span '', options.title
		a '.close-modal', ->
			icon tinyModal.closeIconClass
	contentClass = ['modal-content']
	if options.contentClass?.length
		contentClass = contentClass.concat tinyTemplate.parseClasses(options.contentClass)
	div tinyTemplate.classesToSelector(contentClass), content
	if options.actions?
		for action, i in options.actions
			action._index = i
		div '.modal-actions', ->
			div '.end', ->
				for action in _.filter(options.actions, (a) -> a.end)
					_actionPartial(action)
			div '.start', ->
				for action in _.filter(options.actions, (a) -> !a.end)
					_actionPartial(action)

window.tinyModal.template = _template


_emptyColumnTemplate = tinyTemplate ->
	div '.modal-column', ->
		div '.modal-header'
		div '.modal-content'
		div '.modal-actions'


_topColumn = ->
	$ '#modal-window .modal-column:last'

_topContent = ->
	$ '#modal-window .modal-content:last'

# replaces the content of the top modal on the stack with the given HTML
window.tinyModal.replaceContent = (content)	->
	container = _topContent()
	container.html content

# ensures that the give url has a modal=true param
window.tinyModal.ensureModalUrl = (url) ->
	unless url.indexOf('modal=true') > -1
		if url.indexOf('?') > -1
			url += '&modal=true'
		else
			url += '?modal=true'
	url

# loads a URL or ray HTML into the top modal stack
window.tinyModal.replaceColumn = (urlOrHtml) ->
	container = _topColumn()
	if urlOrHtml.startsWith '<'
		container.html urlOrHtml
	else
		url = tinyModal.ensureModalUrl urlOrHtml
		container.showLoadingOverlay()
		container.load url

# reloads the top modal using the modal-src input or the provided url
window.tinyModal.reload = (url=null, callback=null) ->
	srcInput = _topContent().find('input[name=modal-src]')
	if srcInput.length
		url = srcInput.val()
	unless url?.length
		throw "No url provided for this modal!"
	url = tinyModal.ensureModalUrl url
	container = _topColumn()
	container.showLoadingOverlay()
	container.load url, callback

# set this to true to have breadcrumbs automatically inserted into the header
window.tinyModal.enableBreadcrumbs ||= false

_breadcrumbsTemplate = tinyTemplate (breadcrumbs) ->
	div '.modal-breadcrumbs', ->
		for crumb, i in breadcrumbs
			a '.modal-crumb', data: {level: i+1}, ->
				if crumb.icon?.length
					icon [crumb.icon]
				div '.title', crumb.title

# generate breadcrumbs for the previous columns in the stack and prepend it to the given column's header
# returns an array of the breadcrumbs that were added
window.tinyModal.updateBreadcrumbs = (column) ->
	# remove any previously added breadcrumbs
	column.find('.modal-header .modal-breadcrumbs').remove()

	# find the columns earlier in the stack
	previousColumns = column.prevAll('.modal-column')
	unless previousColumns.length
		return []

	# compute the breadcrumb values
	breadcrumbs = previousColumns.map((index, col) ->
		header = $(col).find('.modal-header h2')
		{
			icon: header.find('i')[0]?.className
			title: header.text()
		}
	).get().reverse()
	puts "Generating breadcrumbs for previous columns", previousColumns, breadcrumbs

	# render the breadcrumbs in the header
	column.find('.modal-header').prepend _breadcrumbsTemplate(breadcrumbs)
	breadcrumbs

# pop the stack back to the given level when a breadcrumb is clicked
$(document).on 'click', '#modal-window a.modal-crumb', (evt) ->
	level = evt.currentTarget.dataset.level
	unless level
		console.warn "No data-level specified for .modal-breadcrumb"
		return
	tinyModal.popTo level
	false

# checks tinyModal.enableBreadcrumbs before updating the breadcrumbs
window.tinyModal.updateBreadcrumbsIfEnabled = (column) ->
	if tinyModal.enableBreadcrumbs
		tinyModal.updateBreadcrumbs column


# removes the actions from the last column
window.tinyModal.removeActions = ->
	$('#modal-window .modal-column:last .modal-actions').remove()

# expands the modal window to take up the whole width and height
window.tinyModal.expand = ->
	win = $('#modal-window')
	win.addClass('no-transition').addClass 'expanded'
	_layoutRow win.children('#modal-row')


# shows a modal with direct content
window.tinyModal.showDirect = (content, options={}) ->
	showOverlay()

	# window
	win = $ '#modal-window'
	unless win.length
		win = $('<div id="modal-window"><div id="modal-row"></div></div>').appendTo 'body'
	win.toggleClass 'tiny', (options.tiny || false)
	win.toggleClass 'expanded', (options.expanded || false)

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
	if options.columnClasses?.length
		column.addClass tinyTemplate.parseClasses(options.columnClasses).join(' ')
	addCallbacks options, column
	tinyModal.updateBreadcrumbsIfEnabled column

	_layoutRow row

	requestAnimationFrame(
		->
			win.addClass 'show'
			column.find('input:not([type=hidden]):first').focus()
			if options.callback?
				options.callback column
			if options.onShow?
				options.onShow column

			if options.actions
				for action in options.actions
					if action._index? and action.callback?
						column.find(".modal-actions .action-#{action._index}").click action.callback
	)

# allows applications to modify the URL before making the modal request
window.tinyModal.modifyUrl = (url) ->
	url


# populate the modal from a URL
window.tinyModal.show = (url, options={}) ->
	showOverlay()

	# add the modal parameter to the link
	unless url.indexOf('modal=true') > -1
		if url.indexOf('?') > -1
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
	addCallbacks options, column

	_layoutRow row

	loaded = false
	column.load(
		url
		(res, status, xhr) ->
			loaded = true
			if status == 'error'
				column.html _template({title: 'Error', title_icon: tinyModal.alertIcon}, "<pre class='error-body'>#{res}</pre>")
				tinyModal.removeLoadingOverlay()
			else
				column.find('input:not([type=hidden]):first').focus()
				if options.callback?
					options.callback column
				if options.onShow?
					options.onShow column
			tinyModal.updateBreadcrumbsIfEnabled column
	)

	# show the window in another frame to allow the animation to happen
	requestAnimationFrame(
		-> win.addClass 'show'
	)

	# show the loader if it hasn't loaded yet
	setTimeout(
		->
			if loaded
				return
			loader = tinyModal.renderLoader url, options
			if loader?.length
				column.find('.modal-content').html loader
		tinyModal.loaderDelay
	)


$(document).on 'click', 'a.modal', (evt) ->
	link = $ evt.currentTarget
	href = link.attr 'href'
	options = {}
	options.tiny = link.hasClass('tiny-modal')
	window.tinyModal.show href, options
	evt.stopPropagation()
	false

# Open a modal on form submit. This is used when you want to open a modal
# with user input using server-side rendering (SSR) templating only.
$(document).on 'submit', 'form.modal', (evt) ->
	# Prevent the default form submission
	evt.preventDefault()
	form = $(evt.currentTarget)
	if form.attr('method') == 'get'
		# Construct the URL with the serialized form data
		href = "#{form.attr('action')}?#{form.serialize()}"
		options = { tiny: form.hasClass('tiny-modal') }
		window.tinyModal.show href, options
	else
		alert("Opening a modal from form.modal submission requires form action='get'")
	# Stop the event from propagating further & ensure no further event handlers execute
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
	modalClasses = tinyTemplate.parseClasses options.classes
	div "#modal-alert#{tinyTemplate.classesToSelector(modalClasses)}", ->
		div '.title', ->
			if options.icon?.length
				icon tinyTemplate.parseClasses(options.icon)
			span '', options.title || 'No Title'
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
					classes = classes.concat action.icon.split(/\s+/)
				a tinyTemplate.classesToSelector(classes), href: action.href, action.title||'No title'
				i += 1


# Shows a modal alert with optionol actions
# options can container:
# - title
# - body
# - icon
# - actions (array)
# Each action can contain:
# - title
# - href
# - icon
# - name
# - classes
# - callback
# Add an action with the close class to close the alert.
# If none is provided, one will automatically be inserted.
tinyModal.showAlert = (options) ->
	tinyModal.async.showAlert(options)
	undefined

# Shows a modal alert and returns a promise that resolves with the action that was clicked
tinyModal.async.showAlert = (options) ->
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
			icon: 'lyph-close glyp-close'
		}

	ui = $(_alertTemplate(options)).appendTo 'body'

	ui.find('a.close').click -> tinyModal.closeAlert()

	{ promise, resolve } = Promise.withResolvers()
	[0..options.actions.length-1].forEach (i) ->
		ui.find(".action-#{i}").click ->
			action = options.actions[i]
			resolve(action)
			if action.callback?
				action.callback()

	setTimeout(
		->
			ui.addClass 'show'
		10
	)

	promise

tinyModal.closeAlert = ->
	unless $('#modal-window').hasClass('show')
		removeOverlay()
	ui = $ '#modal-alert'
	ui.removeClass 'show'
	setTimeout(
		-> ui.remove()
		500
	)

# Shows an alert modal pre-populated with an Okay and Cancel action.
# The Okay action calls the callback while the Cancel action just closes the alert.
tinyModal.confirmAlert = (title, body, callback, options={}) ->
	tinyModal.async.confirmAlert(title, body, options).then (confirmed) ->
		if confirmed
			callback()
	undefined

# Shows an alert modal with an Okay and Cancel action and returns a Promise<boolean>.
# The promise resolves with true when the Okay button is clicked, and resolves with false when the Cancel button is clicked.
tinyModal.async.confirmAlert = (title, body, options={}) ->
	Object.assign options, {
		title: title
		body: body
	}
	options.actions = [
		{
			name: 'confirm'
			title: options.confirmTitle || 'Okay'
			icon: options.confirmIcon || 'ion-checkmark-round lyph-checkmark glyp-checkmark'
			classes: tinyTemplate.parseClasses(options.confirmClasses || 'primary').concat(['close'])
		}
		{
			name: 'cancel'
			title: options.cancelTitle || 'Cancel'
			icon: options.cancelIcon || 'lyph-close glyp-close'
			classes: tinyTemplate.parseClasses(options.cancelClasses || 'secondary').concat(['cancel', 'close'])
		}
	]
	tinyModal.async.showAlert(options).then (action) ->
		action.name == 'confirm'

# Shows an alert modal pre-populated with an Okay action.
# The Okay action just closes the alert.
# Optionally, the action attributes can be overridden with the action argument.
tinyModal.noticeAlert = (title, body, action={}, options={}) ->
	tinyModal.async.noticeAlert(title, body, action, options)
	undefined

# Shows an alert modal pre-populated with an Okay action and returns a promise.
# The promise resolves when the Okay button is clicked.
tinyModal.async.noticeAlert = (title, body, action={}, options={}) ->
	Object.assign options, {
		title: title
		body: body
	}

	okayAction = { title: 'Okay', icon: 'lyph-checkmark glyp-checkmark', classes: ['secondary'] }
	okayAction = Object.assign okayAction, action
	classes = tinyTemplate.parseClasses okayAction.classes
	unless classes.includes('close')
		classes.push 'close'
		okayAction.classes = classes
	options.actions = [okayAction]

	tinyModal.async.showAlert(options).then (action) ->
		if action.callback?
			action.callback()
		undefined

# Same as tinyModal.noticeAlert, but defaults to .alert and with an alert icon
tinyModal.alertAlert = (title, body, action={}, options={}) ->
	tinyModal.async.alertAlert(title, body, action, options)
	undefined

# Same as tinyModal.async.noticeAlert, but defaults to .alert with an alert icon
tinyModal.async.alertAlert = (title, body, action={}, options={}) ->
	options.icon ||= 'lyph-alert glyp-alert'
	classes = tinyTemplate.parseClasses options.classes
	classes.push 'alert'
	options.classes = classes
	tinyModal.async.noticeAlert(title, body, action, options)
