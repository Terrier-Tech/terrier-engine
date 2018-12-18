


$(document).on 'click', 'a.simple-modal', ->
	tinyModal.showDirect(
		"<h1 class='text-center'>A Modal!</h1>"
		title: 'A Simple Modal'
	)