
_classRegex = /\.[\w-]+/g
_idRegex = /#[\w-]+/g

_context = {content: ''}

_tags = ['a', 'button', 'br', 'datalist', 'canvas', 'div', 'dl', 'dd', 'dt', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'hr', 'icon', 'iframe', 'img', 'input', 'label', 'li', 'ol', 'option', 'optgroup', 'p', 'pre', 'script', 'select', 'span', 'strong', 'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 'tr', 'ul']

_ropeCase = (s) ->
	if s == 'icon'
		return 'i'
	s.replace(/([A-Z])/g, (match) ->
		if match then '-' + match.toLowerCase() else ''
	).trim()

for tag in _tags
	eval "#{tag} = function(selector, attrs, func) { appendTag('#{_ropeCase(tag)}', selector, attrs, func) }"
eval "t = function(s) {_context.content += ' ' + s + ' '}"

# parse a css selector into classes and an id (returned as an object)
parseSelector = (selector) ->
	res = {
	}
	classes = selector.match(_classRegex)
	if classes
		res.classes = for c in classes then c.substring(1)
	ids = selector.match(_idRegex)
	if ids? and ids.length > 0
		res.id = ids[0].substring(1)
	res

# sanitizes an attribute name by replacing underscores with dashes and downcasing it
sanitizeKey = (key) ->
	key.replace(/_/g, '-').toLowerCase()

sanitizeValue = (s) ->
	s.toString().replace(/\"/g, "&quot;")

# serialize and attributes object into a string
# converts underscores to dashes, and inlines embedded objects (like data)
serializeAttributes = (attrs) ->
	return '' unless attrs
	attrStrings = for k, v of attrs
		k = sanitizeKey k
		if typeof v == 'object'
			inlineStrings = for ik, iv of v
				if iv?
					"#{k}-#{sanitizeKey(ik)}=\"#{sanitizeValue(iv)}\""
			inlineStrings.join(' ')
		else
			if v?
				"#{k}=\"#{sanitizeValue(v)}\""
	attrStrings.join ' '

# appends a tag to the global context
appendTag = (tag, selector, attrs, func) ->
	_context.content += "<#{tag}"

	# add the attributes
	selAttrs = parseSelector(selector)
	if selAttrs.classes
		_context.content += " class='#{selAttrs.classes.join(' ')}'"
	if selAttrs.id
		_context.content += " id='#{selAttrs.id}'"
	if typeof attrs == 'object'
		_context.content += " #{serializeAttributes(attrs)}>"
	else
		_context.content += '>'

	# add the content
	if !attrs?
		# skip
	else if typeof attrs == 'string'
		_context.content += attrs
	else if typeof attrs == 'function'
		attrs()
	else if attrs.text
		_context.content += attrs.text
	else if typeof func == 'string'
		_context.content += func
	else if typeof func == 'function'
		func()
	_context.content +="</#{tag}>"

window.tinyTemplate = (root) ->
	(args...) ->
		_context = {content: ''}
		root(args...)
		_context.content


window.tinyTemplate.render = (container, html) ->
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
		puts "[TinyTemplate] Using tinyTemplate.render without morphdom!"
		container.innerHTML = html
		return

	# if container is empty, don't bother with morphdom and just set the entire innerHTML
	root = container.children[0]
	unless root?
		container.innerHTML = html
		dt = performance.now() - t
		puts "[TinyTemplate] Inserted template directly in #{dt.toFixed(2)}ms"
		return

	# there should be only one root, otherwize we don't know what to update
	if container.childElementCount > 1
		throw "Can't use tinyTemplate.render with templates containing more than one root!"

	# morph the actual dom
	morphdom root, html, {
		onBeforeElUpdated: (fromEl, toEl) ->
			if toEl.tagName == 'INPUT'
				toEl.value = fromEl.value
	}

	dt = performance.now() - t
	puts "[TinyTemplate] Morphed to template in #{dt.toFixed(2)}ms"
