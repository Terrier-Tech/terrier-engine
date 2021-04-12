
window.tinyRender = (container, html) ->
	t = performance.now()

	# ensure container is a single element
	if typeof container == 'string'
		container = document.querySelector(container) || throw("No matches for selector #{container}")
	else if container.length # assume it's a jquery object
		container = container[0]
	unless container?
		throw "You must pass a container!"

	# fallback if morphdom isn't present
	unless morphdom?
		puts "[TinyRender] Using tinyRender without morphdom!"
		container.innerHTML = html
		return

	# if container is empty, don't bother with morphdom and just set the entire innerHTML
	root = container.children[0]
	unless root?
		container.innerHTML = html
		dt = performance.now() - t
		puts "[TinyRender] Inserted template directly in #{dt.toFixed(2)}ms"
		return

	# there should be only one root, otherwize we don't know what to update
	if container.childElementCount > 1
		throw "Can't use tinyRender with templates containing more than one root!"

	# morph the actual dom
	morphdom root, html, {
		onBeforeElUpdated: (fromEl, toEl) ->
			if toEl.tagName == 'INPUT'
				toEl.value = fromEl.value
	}

	dt = performance.now() - t
	puts "[TinyRender] Morphed to template in #{dt.toFixed(2)}ms"