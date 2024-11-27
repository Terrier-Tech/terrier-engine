tinyModal.closeIconClass = '.glyp-close'
tinyModal.enableBreadcrumbs = true

## Loader

_loaderTemplate = tinyTemplate (url, options) ->
	h3 '.text-center', "Loading #{url}..."

window.tinyModal.renderLoader = (url, options) ->
	puts "tinyModal.renderLoader for #{url}", options
	_loaderTemplate url, options


## Actions

_withActionsTemplate = tinyTemplate ->
	h1 '.text-center', 'Modal With Actions!'
	input '.hidden', type: 'hidden'
	input '.focus', type: 'text', placeholder: 'focus'

$(document).on 'click', 'a.modal-with-actions', ->
	tinyModal.showDirect(
		_withActionsTemplate()
		title: 'Modal'
		title_icon: 'gear-a'
		actions: [
			{
				title: 'Submit'
				icon: 'checkmark-round'
				class: 'primary'
				attrs: {data: {id: '123'}}
			}
			{
				title: 'Delete'
				icon: 'close-round'
				class: 'alert'
				end: true
			}
			{
				title: 'Expand'
				icon: 'arrow-expand'
				class: 'expand'
				end: true
			}
		]
		callback: (modal) ->
			modal.find('a.expand').click ->
				tinyModal.expand()
				$(this).remove()
	)


## Alerts

$(document).on 'click', 'a.custom-modal-alert', ->
	tinyModal.showAlert(
		title: "This is an Alert!"
		body: "Here's some more information about the alert. It can contain <strong>markup</strong>"
		actions: [
			{
				title: 'Do Something'
				classes: 'alert'
				callback: -> alert("Here's a native alert")
			}
			{
				title: 'Scripts'
				href: '/scripts'
			}
		]
	)

$(document).on 'click', 'a.confirm-modal-alert', ->
	tinyModal.confirmAlert(
		"Are you sure?"
		"This is a confirm alert modal"
		-> alert 'Confirmed'
		icon: 'ion-ios-help-outline'
	)

$(document).on 'click', 'a.notice-modal-alert', ->
	tinyModal.noticeAlert(
		"Something happened!"
		"This is a notice alert modal"
		{
			title: 'Got It'
		}
		icon: 'ion-alert'
	)

$(document).on 'click', 'a.alert-modal-alert', ->
	tinyModal.alertAlert(
		"Something happened!"
		"This is an ALERT alert modal"
	)


## Reload

$(document).on 'click', 'a.modal-reload', ->
	tinyModal.showDirect(
		"<h1 class='text-center modal-reload'>The page will reload when you close this modal!</h1>"
		title: 'Modal'
		title_icon: 'gear-a'
	)

## On Show
$(document).on 'click', 'a.modal-on-show', ->
	closeAction = { title: 'Close', class: 'close-modal' }
	tinyModal.showDirect(
		"<h1 class='text-center'>An alert will show every time this modal is shown!</h1>"
		title: 'On-show demo'
		onShow: -> alert('This alert is shown every time the modal is shown!')
		actions: [
			{
				title: 'Open next modal'
				callback: ->
					tinyModal.showDirect(
						"<h1 class='text-center'>Close me!</h1>"
						title: 'Open next modal'
						actions: [ closeAction ]
					)
			}
			closeAction
		]
	)

## On Pop

$(document).on 'click', 'a.modal-on-pop', ->
	closeAction = { title: 'Close', class: 'close-modal' }
	tinyModal.showDirect(
		"<h1 class='text-center'>A callback will execute and show you an alert when you pop this modal!</h1>"
		title: 'On-pop demo'
		onPop: -> alert('Goodbye!')
		actions: [
			closeAction
		]
	)

## On Show & On Pop

$(document).on 'click', 'a.modal-on-show-on-pop', ->
	closeAction = { title: 'Close', class: 'close-modal' }
	tinyModal.showDirect(
		"<h1 class='text-center' id='first-modal'>On-show will execute an alert every time this modal is shown!</h1>"
		title: 'On-show & on-pop demo'
		onShow: ->
			alert('On show fired me!')
		actions: [
			{
				title: 'Open next modal'
				callback: ->
					tinyModal.showDirect(
						"<h1 class='text-center'>On-pop will change the contents of the previous modal when you close this one!</h1>"
						title: 'New Modal'
						onPop: ->
							$('h1#first-modal').text 'On-pop changed my contents!'
						actions: [ closeAction ]
					)
			}
			closeAction
		]
	)


## No Layout

_noLayoutTemplate = tinyTemplate ->
	div '.no-layout', ->
		p '', 'This modal renders its own layout'
		a '.close-modal', 'Close'

$(document).on 'click', 'a.no-layout-modal', ->
	tinyModal.showDirect(
		_noLayoutTemplate()
		title: 'Modal'
		title_icon: 'gear-a'
		layout: false
	)


## Stacked

_stackTemplate = tinyTemplate (depth) ->
	div ".stack-#{depth}.text-center", ->
		h1 '', "Stack #{depth}"
		a '.stacked-modal', data: {depth: depth+1}, 'Push Stack'

$(document).on 'click', 'a.stacked-modal', ->
	depth = parseInt ($(this).data('depth') || '1')
	tinyModal.showDirect(
		_stackTemplate(depth)
		title: 'Stacked Modal'
		title_icon: 'navicon-round'
		expanded: true
		contentClass: 'stacked-content'
		actions: [
			{
				title: 'Push Stack'
				icon: 'chevron-right'
				class: 'stacked-modal'
				attrs: {data: {depth: depth+1}}
			}
			{
				title: 'Pop Stack'
				icon: 'chevron-left'
				class: 'close-modal'
				end: true
			}
		]
	)


## Replace Content

_replaceContentTemplate = tinyTemplate ->
	div '.replace-content', ->
		h1 '.text-center', ->
			a '.replace-content', 'Replace Client-Side'
		h1 '.text-center', ->
			input '', type: 'hidden', name: 'modal-src', value: '/replaced_content'
			a '.reload-column', 'Reload Server-Side'

$(document).on 'click', 'a.replace-content-modal', ->
	tinyModal.showDirect(
		_replaceContentTemplate()
		title: 'Replaceable'
		title_icon: 'arrow-swap'
		callback: (modal) ->
			modal.find('a.replace-content').click ->
				tinyModal.replaceContent '<h2 class="text-center">Replaced Client-Side!</h2>'
	)

$(document).on 'click', 'a.reload-column', ->
	tinyModal.reload()



## Wide Modal Content

_wideContentTemplate = tinyTemplate ->
	div '.wide-content', ->
		table '', ->
			tr '', ->
				for i in [0..100]
					td '', i.toString()

_narrowContentTemplate = tinyTemplate ->
	div '.narrow-content', ->
		h1 '.text-center', 'This is some narrow content'

$(document).on 'click', 'a.wide-content-modal', ->
	tinyModal.showDirect(
		_wideContentTemplate()
		title: 'Wide Content'
		title_icon: 'arrow-expand'
		actions: [
			{
				title: 'Load Narrow'
				class: '.load-narrow'
			}
			{
				title: 'Expand'
				class: '.expand'
				end: true
			}
		]
		callback: (modal) ->
			modal.find('.load-narrow').click ->
				tinyModal.showDirect(
					_narrowContentTemplate()
					title: 'Narrow Content'
					title_icon: 'arrow-shrink'
				)
			modal.find('.expand').click ->
				tinyModal.expand()
	)

