window.tinyLogger = {}

_getTime = ->
	date = new Date()
	date.toLocaleTimeString().split(' ').join(".#{date.getMilliseconds().toString()} ") # show time with milliseconds

_logTemplate = tinyTemplate (prefix, level, t, message) ->
	div ".log.#{level}", ->
		span '.prefix', "[#{prefix}]"
		span '.level', level.toUpperCase()
		span '.timestamp', t
		span '.message', message

window.tinyLogger.init = (object, options={}) ->
	prefix = options.prefix || object.__proto__?.constructor?.name || 'TinyLogger'
	output = null
	if options.output?.length
		output = $ options.output

	log = (level, message, args...) ->
		t = _getTime()
		s = "[#{prefix} #{level.toUpperCase()} #{t}] #{message}"
		console[level] s, args...
		if output
			output.append _logTemplate(prefix, level, t, message)

	object.debug = (m, args...) ->
		log 'debug', m, args...

	object.info = (m, args...) ->
		log 'info', m, args...

	object.warn = (m, args...) ->
		log 'warn', m, args...

	object.error = (m, args...) ->
		log 'error', m, args...