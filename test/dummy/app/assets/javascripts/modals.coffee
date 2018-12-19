


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
			}
			{
				title: 'Delete'
				icon: 'ion-close-round'
				class: 'alert'
				end: true
			}
		]
	)