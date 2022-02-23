
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

makeTagFunc = (t) ->
	rct = _ropeCase(tag)
	window[tag] = (selector, attrs, func) ->
		appendTag(rct, selector, attrs, func)
for tag in _tags
	makeTagFunc tag

# parse a css selector into classes and an id (returned as an object)
parseSelector = (selector) ->
	if Array.isArray selector # allow an array of classes to be used instead of the string
		return {classes: selector}
	res = {}
	classes = selector.match(_classRegex)
	if classes
		res.classes = for c in classes then c.substring(1)
	ids = selector.match(_idRegex)
	if ids?.length
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

	# tr -> can be used instead of tr '', ->
	if _.isFunction(selector)
		_context.content += '>'
		selector()
		_context.content +="</#{tag}>"
		return

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

# converts an array of classes to a dot-prefixed selector string
window.tinyTemplate.classesToSelector = (classes) ->
	_.map(tinyTemplate.parseClasses(classes), (c) -> ".#{c}").join()

# parses a string containing (space or period-delimited) classes into an array
# passing an array simply returns the array
window.tinyTemplate.parseClasses = (classes) ->
	unless classes?.length
		return []
	if typeof classes == 'string'
		classes.split /[\s\.]+/
	else
		classes