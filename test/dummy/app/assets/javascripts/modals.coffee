


$(document).on 'click', 'a.simple-modal', ->
	tinyModal.showDirect(
		"<h1 class='text-center'>A Modal!</h1>"
		title: 'Modal'
		title_icon: 'gear-a'
	)

$(document).on 'click', 'a.modal-with-actions', ->
	tinyModal.showDirect(
		"<h1 class='text-center'>Modal With Actions!</h1>"
		title: 'Modal'
		title_icon: 'gear-a'
		actions: [
			{
				title: 'Submit'
				icon: 'ion-checkmark-round'
				class: 'primary'
				attrs: {href: '#'}
			}
			{
				title: 'Delete'
				icon: 'ion-close-round'
				class: 'alert'
				end: true
			}
		]
	)

$(document).on 'click', 'a.modal-reload', ->
	tinyModal.showDirect(
		"<h1 class='text-center modal-reload'>The page will reload when you close this modal!</h1>"
		title: 'Modal'
		title_icon: 'gear-a'
	)