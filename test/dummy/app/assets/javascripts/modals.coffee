

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
		]
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
	)

$(document).on 'click', 'a.notice-modal-alert', ->
	tinyModal.noticeAlert(
		"Something happened!"
		"This is a notice alert modal"
		{
			title: 'Got It'
			icon: 'ion-checkmark-round'
		}
	)


## Reload

$(document).on 'click', 'a.modal-reload', ->
	tinyModal.showDirect(
		"<h1 class='text-center modal-reload'>The page will reload when you close this modal!</h1>"
		title: 'Modal'
		title_icon: 'gear-a'
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
			a '.replace-content', 'Replace Content'

$(document).on 'click', 'a.replace-content-modal', ->
	tinyModal.showDirect(
		_replaceContentTemplate()
		title: 'Replaceable'
		title_icon: 'arrow-swap'
		callback: (modal) ->
			modal.find('a.replace-content').click ->
				tinyModal.replaceContent '<h2 class="text-center">Replaced!</h2>'
	)

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

