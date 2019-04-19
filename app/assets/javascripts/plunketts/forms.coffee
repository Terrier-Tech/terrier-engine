window.forms ||= {}

################################################################################
# Options For Select
################################################################################

# meant to be used inside a tinyTemplate, behaves the same as Rails options_for_select
window.forms.optionsForSelect = (options, current=null) ->
	# convert a simple array of strings to the proper format
	if options?.length and typeof options[0] == 'string'
		options = for opt in options
			[opt.titleize(), opt]
	for opt in options
		value = _.last opt # to match options_for_select behavior
		selected = if value==current then 'selected' else null
		option '', {value: value, selected: selected}, opt[0]

# replaces the options on an existing select element
window.forms.replaceSelectOptions = (select, options, current=null) ->
	select.html (tinyTemplate -> forms.optionsForSelect(options, current))()


################################################################################
# Grouped Options For Select
################################################################################

# meant to be used inside a tinyTemplate, behaves the same as Rails grouped_options_for_select
window.forms.groupedOptionsForSelect = (options, current=null) ->
	for group in options
		optgroup '', label: group[0], ->
			for opt in group[1]
				value = _.last opt # to match options_for_select behavior
				selected = if value==current then 'selected' else null
				option '', {value: value, selected: selected}, opt[0]

# replaces the options on an existing select element
window.forms.replaceGroupedSelectOptions = (select, options, current=null) ->
	select.html (tinyTemplate -> forms.groupedOptionsForSelect(options, current))()



################################################################################
# jQuery Extensions
################################################################################

# serialize to an object instead of string or array
jQuery.fn.serializeObject = ->
	arrayData = @serializeArray()
	objectData = {}
	$.each arrayData, ->
		if @value?
			value = @value
		else
			value = ''
		if @name.includes('[',']')
			splitName = @name.split('[')
			field = splitName[1].replace(']','')
			objectName = splitName[0]

			unless objectData[objectName]?
				objectData[objectName] = {}

			objectData[objectName][field] = value.trim()

		else if objectData[@name]?
			unless objectData[@name].push
				objectData[@name] = [objectData[@name]]

			objectData[@name].push value
		else
			objectData[@name] = value
	return objectData

_errorExplanationTemplate =

# populate errors returned from active record
jQuery.fn.showErrors = (errors) ->
	this.find('.error').removeClass 'error'
	unless errors?
		return
	for key, messages of errors
		el = this.find("[name=#{key}]")
		el.addClass 'error'
	errorExplanation = this.find('.error-explanation')
	errorExplanation.show().html tinyTemplate( ->
		ul '', ->
			for key, message of errors
				li '', "#{key} #{message}"
	)()