window.scripts = {}


_scheduleDaysDisplay = (days) ->
	if !days or days.length == 0
		return 'never'
	if days.length == 7
		return 'every day'
	'on ' + window.joinWithCommas(days)


################################################################################
# Script List
################################################################################

$(document).on 'keyup', 'input.script-filter', (evt) ->
	input = $(this)
	s = (input.val() || '').toLowerCase()
	console.log "filter '#{s}'"
	unless s.length
		$('table.scripts tr.script').show()
		return
	$('table.scripts tr.script').each (index, elem) ->
		row = $(elem)
		title = row.data('title')
		if title.indexOf(s) > -1
			row.show()
		else
			row.hide()


################################################################################
# Input Modal
################################################################################

$(document).on 'click', 'a.delete-script-input', ->
	link = $(this)
	id = link.attr('href').replace('#', '')
	if confirm 'Are you sure you want to delete this input?'
		window.setLinkLoading link
		$.delete(
			"/script_inputs/#{id}"
			{}
			(res) ->
				window.unsetLinkLoading link
				window.reloadPage()
		)
	false


################################################################################
# Messages List
################################################################################

class MessagesList
	constructor: (@ui) ->
		@buffer = []
		theUi = @ui
		this.scrollToBottom = _.debounce(
			-> theUi.scrollTop(theUi[0].scrollHeight)
			200
			{maxWait: 250}
		)

	clear: ->
		@ui.html ''

	addBuffered: (message) ->
		unless message?
			return
		@buffer.push "<div class='message #{message.type}'>#{message.body}</div>"

	flushBuffer: ->
		@ui.append @buffer.join('')
		@buffer = []


################################################################################
# Runner
################################################################################

# actually runs a script
# listener should have the following methods:
#   beforeRun()
#   onChunks(chunks)
#   afterRun()
class ScriptRunner
	constructor: (@script, @listener) ->
		@cancelContainer = null
		@fieldValues = null

	run: ->
		cancelButton = $('<a class="cancel-exec ion-close-round">Cancel</a>')
		if @cancelContainer?
			@cancelContainer.append cancelButton
		@listener.beforeRun()

		shouldCancel = false
		cancelButton.click =>
			shouldCancel = true
			@listener.afterRun()
			cancelButton.remove()

		url = '/scripts/exec.json'
		if @script.id?.length
			url += "?id=#{@script.id}"

		data = {body: @script.body}
		if @fieldValues?
			data.field_values = @fieldValues

		theListener = @listener

		onDone = ->
			theListener.afterRun()
			cancelButton.remove()
			theListener.afterRun()

		onChunk = (rawChunk) ->
			if shouldCancel
				console.log "Cancelling!!"
				return this.abort()
			chunk = JSON.parse JSON.stringify(rawChunk)
			console.log chunk
			if chunk.type?
				theListener.onChunks [chunk]
			if chunk.type == 'error'
				onDone()
			oboe.drop

		oboe(
			url: url
			method: 'POST'
			headers: {accept: 'application/json'}
			credentials: 'include'
			body: data
		)
		.node('!.*', onChunk)
		.done(onDone) # as far as I can tell, this never gets called


################################################################################
# Controller
################################################################################
class ScriptController
	constructor: (id) ->
		ace.require 'ace/ext/language_tools'
		@editor = ace.edit(id)
		@editor.setTheme 'ace/theme/textmate'
		@editor.setDisplayIndentGuides true
		@editor.setShowFoldWidgets false
		@session = @editor.getSession()
		@session.setMode 'ace/mode/ruby'
		@session.setTabSize 2

		@ui = $('.script-editor')
		@toolBar = $('.tool-bar')
		@editorView = @ui.find "##{id}"
		@syntaxErrorOutput = @ui.find '.syntax-error-output'

		@scriptId = @toolBar.find('#script-id').val()

		@moreScripts = @toolBar.find '#script-more'
		@saveButton = @toolBar.find '#script-save'
		@scriptTitle = @toolBar.find '#script-title'
		@clearButton = @toolBar.find '#script-clear'

		@saveButton.click =>
			this.save()

		@moreScripts.click =>
			@moreScripts.addClass('pulsing')
			new SelectScriptModal @moreScripts

		if @scriptId?
			window.initSetupEditor()

		@reportSetupPane = null
		reportSetupPaneView = $('.script-report-setup')
		if reportSetupPaneView.length > 0
			@reportSetupPane = new ReportSetupPane(reportSetupPaneView)

		@runButton = @ui.find 'a.run-script'
		@runButton.click =>
			if @runButton.attr 'disabled'
				alert "Fix errors in the script!"
			else
				this.run()

		@clearButton.click =>
			@editor.setValue('')
			@scriptId = @toolBar.find '#script-id'
			@scriptId.val('')
			@visibility = @toolBar.find '#script-public'
			@visibility.prop('checked',true)
			@scriptTitle.val('')

		@messagesList = new MessagesList(@ui.find('.messages'))

		@inputFilesView = @ui.find '.files-pane.input .file-list'
		@outputFilesView = @ui.find '.files-pane.output .file-list'

		this.updateInputFiles()

		@errorMarkerId = null

		@editor.commands.addCommand(
			name: 'save'
			bindKey: {win: 'Ctrl-S',  mac: 'Command-S'}
			exec: (e) =>
				this.save()
		)

		@editor.setOptions(
			enableBasicAutocompletion: true
			enableSnippets: true
			enableLiveAutocompletion: false
		)

		changeHandler = _.debounce(
			=> this.onChanged(),
			500)
		@editor.on 'change', changeHandler

		$('a.use-for-report').click =>
			if confirm("Use this script for a report? This will replace the console and file panes with the report settings.")
				@forceReportCategory = window.constants.Script.reportCategories[0]
				this.save()

	getSelection: ->
		@session.getTextRange(@editor.getSelectionRange())

	onChanged: ->
		$.get(
			'/scripts/check'
			{body: @editor.getValue()}
			(res) =>
				console.log res
				this.clearDiagnostic()
				if res.diagnostic
					this.setDiagnostic res.diagnostic
		)

	clearDiagnostic: ->
		if @errorMarkerId
			@session.removeMarker @errorMarkerId
			@errorMarkerId = null
		@syntaxErrorOutput.removeClass('error').text 'No Errors'
		@runButton.attr 'disabled', null

	setDiagnostic: (diagnostic) ->
		Range = ace.require("ace/range").Range
		loc = diagnostic.location
		src = loc.source_buffer
		line = _.values(src.line_for_position)[0]
		cols = _.values(src.column_for_position)
		console.log "error on line #{line} from #{cols[0]} to #{cols[1]}"
		range = new Range(line-1, cols[0]-1, line-1, cols[1]+1)
		@errorMarkerId = @session.addMarker(range, 'syntax-error', 'error')
		@syntaxErrorOutput.addClass('error').text "#{diagnostic.reason}: #{diagnostic.arguments.token}"
		@runButton.attr 'disabled', 'disabled'

	beforeRun: ->
		@messagesList.clear()
		this.clearOutputFiles()
		window.showLoadingOverlay @editorView

	onChunks: (chunks) ->
		for chunk in chunks
			if chunk.type == 'file'
				this.addOutputFile chunk
			else
				@messagesList.addBuffered chunk
		@messagesList.flushBuffer()
		@messagesList.scrollToBottom()

	afterRun: ->
		window.removeLoadingOverlay @editorView

	clearOutputFiles: ->
		@outputFilesView.html ''

	addOutputFile: (file) ->
		@outputFilesView.append "<a class='file' href='#{file.body}' target='_blank'>#{file.body}</a>"

	updateInputFiles: ->
		if @inputFilesView.length == 0
			return
		@inputFilesView.html ''
		window.showItemWaitingOverlay @inputFilesView
		$.get(
			"/scripts/#{@scriptId}/inputs"
			(res) =>
				window.removeLoadingOverlay @inputFilesView
				for input in res.inputs
					@inputFilesView.append "<a class='file modal' href='/script_inputs/#{input.id}/edit'>#{input.name}</a>"
		)

	run: ->
		script = this.serialize()
		if @reportSetupPane?
			new ReportExecModal(script)
		else
			runner = new ScriptRunner(script, this)
			runner.cancelContainer = @ui.find('.edit-pane')
			runner.run()

# returns true if there are no errors
	serialize: ->
		visibility = if @toolBar.find('#script-public').prop('checked') then 'public' else 'private'
		script = {
			title: @scriptTitle.val()
			body: @editor.getValue()
			visibility: visibility
		}
		if @scriptId?.length
			script.id = @scriptId
			scheduleRulesInput = @ui.find('input.schedule_rules_s')
			if scheduleRulesInput.length
				window.serializeScheduleRules()
				script.schedule_rules_s = scheduleRulesInput.val()
				script.schedule_time = @ui.find('#schedule_time').val()
		if @reportSetupPane?
			@reportSetupPane.serialize script
		script

	save: ->
		if @scriptTitle.val().length < 1
			alert "Please add a title"
			return
		script = this.serialize()
		if @ui.find('.syntax-error').length > 0
			alert "Fix syntax errors before saving, please"
			return
		if @forceReportCategory?
			script.report_category = @forceReportCategory
		else if !script.report_category?
			script.report_category = 'none'
		window.showLoadingOverlay(@ui)
		$.post(
			'/scripts/upsert'
			{script: script}
			(res) ->
				newScript = res.script
				console.log 'successfully saved script'
				window.removeLoadingOverlays()
				if res.status == 'success'
					Turbolinks.visit "/scripts/#{newScript.id}/edit"
				else
					alert res.message
		)


_controller = null

window.scripts.initEditor = ->
	_controller = new ScriptController 'script-editor'

window.scripts.updateInputFiles = ->
	_controller.updateInputFiles()


################################################################################
# Help
################################################################################

window.scripts.initHelp = ->
	ace.require 'ace/ext/language_tools'
	editor = ace.edit('script-editor')
	editor.setTheme 'ace/theme/textmate'
	editor.setDisplayIndentGuides true
	editor.setShowFoldWidgets false
	session = editor.getSession()
	session.setMode 'ace/mode/ruby'
	session.setTabSize 2


################################################################################
# Report Setup Pane
################################################################################

_fieldTemplate = window.tinyTemplate (field) ->
	div '.script-field.row.fields-row', ->
		div '.small-3.columns', ->
			input '.field-name', {type: 'text', value: field.name}
		div '.small-3.columns', ->
			select '.field-field_type', ->
				for type in window.constants.ScriptField.fieldTypes
					selected = if field.field_type == type then 'selected' else null
					option '', {value: type, selected: selected}, window.titleize(type)
		div '.small-5.columns', ->
			input '.field-default_value', {type: 'text', value: field.default_value}
		div '.small-1.columns', ->
			a '.remove-field.ion-close-round.alert', {title: 'Remove Field'}
		div '.values-container', ->
			input '.field-values', {type: 'text', placeholder: 'Values', value: field.values}
		div '.sort-handle.ion-android-more-vertical'

class ReportSetupPane
	constructor: (@ui) ->
		@fieldsContainer = @ui.find '.fields-container'

		@fieldsInput = $('input#script-fields')
		fields = JSON.parse @fieldsInput.val()

		# poulate the fields
		for field in fields
			row = $(_fieldTemplate(field)).appendTo @fieldsContainer
			if field.field_type == 'select'
				row.find('.values-container').show()

		# show the values input when type is 'select'
		@fieldsContainer.on 'change', '.field-field_type', (evt) =>
			typeField = $(evt.currentTarget)
			row = typeField.parents('.fields-row')
			valuesContainer = row.find '.values-container'
			if typeField.val() == 'select'
				valuesContainer.show()
			else
				valuesContainer.hide()

		new Sortable @fieldsContainer[0]

		@ui.find('a.new-field').click => this.addField()

		@ui.on 'click', 'a.remove-field', (evt) =>
			fieldView = $(evt.currentTarget).parents('.script-field')
			fieldView.remove()
			false

	addField: ->
		view = _fieldTemplate {field_type: window.constants.ScriptField.fieldTypes.first}
		@fieldsContainer.append view

	serialize: (script) ->
		@ui.find('.error').removeClass 'error'
		@ui.serialize script, 'script-'
		fields = @fieldsContainer.find('.script-field').map((index, elem) ->
			fieldData = {}
			$(elem).serialize fieldData, 'field-'
			unless fieldData.name?.length
				$(elem).find('.field-name').addClass 'error'
			fieldData
		).get()
		script.script_fields_json = JSON.stringify(fields)
		@ui.find('.error').length == 0


$(document).on 'click', 'a.report-setup-modal', ->
	new ReportSetupModal $(this).data('id')


################################################################################
# Report Exec Modal
################################################################################

_fieldControls = {}

_fieldControls.date = (name, value, options) ->
	date = if value
		moment(value).format('YYYY-MM-DD')
	else
		''
	"<input type='text' name='#{name}' value='#{date}' class='datepicker'/>"

_fieldControls.string = (name, value, options) ->
	"<input type='text' name='#{name}' value='#{value}'/>"

_fieldControls.select = (name, value, options) ->
	s = "<select name='#{name}'>"
	for opt in options
		s += "<option value='#{opt}'>#{opt}</option>"
	s + '</select>'

_fieldControls.csv = (name, value, options) ->
	"<input type='file' name='#{name}' accept='text/csv'/>"

_reportExecModalTemplate = window.tinyTemplate (script, fieldValues, fieldOptions) ->
	div '.script-report-exec-modal.row.smart-collapse', ->
		div '.inline-actions.right', ->
			a '.ion-clock.modal', {href: "/scripts/#{script.id}/runs"}, 'History'
			a '.ion-ios-gear-outline.modal', {href: "/scripts/#{script.id}/edit_settings"}, 'Settings'
			if window.users.getCurrent().role == 'super'
				a '.ion-ios-compose-outline', {href: "/scripts/#{script.id}/edit"}, 'Edit'
		if script.description?.length
			p '.description', script.description
		div '.medium-3.columns', ->
			h4 '.ion-ios-upload-outline', 'Inputs'
			div '.script-field-controls', ->
				fields = JSON.parse script.script_fields_json
				for field in fields
					value = fieldValues[field.name]
					options = fieldOptions[field.name]
					div '.field-controls', ->
						label '', field.name
						div '', _fieldControls[field.field_type](field.name, value, options)
			div '.cancel-button-container'
		div '.medium-6.columns', ->
			h4 '.ion-ios-download-outline', 'Output'
			div '.script-messages'
		div '.medium-3.columns', ->
			h4 '.ion-ios-copy-outline', 'Files'
			div '.output-files'


class ReportExecModal
	constructor: (@script) ->
		unless @script.script_fields_json?
			@script.script_fields_json = JSON.stringify(@script.script_fields || @script.script_fields_array)
		$.post(
			"/scripts/compute_field_values"
			{script_fields_json: @script.script_fields_json}
			(res) =>
				unless res.status == 'success'
					alert res.message
					return
				fieldValues = res.field_values
				fieldOptions = res.field_options
				content = _reportExecModalTemplate(@script, fieldValues, fieldOptions)
				window.showModal(
					content
					{title: @script.title, icon: 'code-download', submit_title: 'Run'}
					(modal) => this.init(modal)
				)
		)

	init: (@ui) ->
		runButton = @ui.find('a.submit-link')
		runButton.click (evt) =>
			this.run()
			evt.preventDefault()
			false

		@messagesList = new MessagesList(@ui.find('.script-messages'))
		@scriptFieldControls = @ui.find '.script-field-controls'
		@outputFilesView = @ui.find '.output-files'

	readInput: (input, callback) ->
		if input.attr('type') == 'file'
			file = input[0].files[0]
			unless file?
				callback null
				return
			reader = new FileReader()
			reader.readAsText(file)
			reader.onload = (loadEvent) ->
				text = loadEvent.target.result
				callback text
		else # not a file
			callback input.val()

	run: ->
		fieldValues = {}
		@ui.find('.error').removeClass 'error'
		inputs = @ui.find('.script-field-controls input, .script-field-controls select')

		runner = new ScriptRunner(@script, this, {})
		runner.cancelContainer = @ui.find '.cancel-button-container'
		actuallyRun = _.after inputs.length, =>
			if @ui.find('.error').length > 0
				return
			runner.fieldValues = fieldValues
			runner.run()

		if inputs.length == 0
			actuallyRun()
			return
		inputs.each (index, elem) =>
			input = $(elem)
			do (input) =>
				this.readInput input, (value) ->
					unless value?.length
						input.addClass 'error'
					name = input.attr('name')
					fieldValues[name] = value
					actuallyRun()

	beforeRun: ->
		@messagesList.clear()
		this.clearOutputFiles()
		window.showLoadingOverlay @scriptFieldControls

	onChunks: (chunks) ->
		for chunk in chunks
			if chunk.type == 'file'
				this.addOutputFile chunk
			else
				@messagesList.addBuffered chunk
		@messagesList.flushBuffer()
		@messagesList.scrollToBottom()

	afterRun: ->
		window.removeLoadingOverlay @scriptFieldControls

	clearOutputFiles: ->
		@outputFilesView.html ''

	addOutputFile: (file) ->
		fileName = _.last file.body.split('/')
		icon = window.iconClasses.fileType fileName
		@outputFilesView.append "<a class='file #{icon}' href='#{file.body}' target='_blank'>#{fileName}</a>"


window.scripts.showReportExecModal = (scriptId) ->
	tinysync.db.find(
		'script'
		scriptId
		{}
		(script) ->
			script.script_fields = _.toArray script.script_fields
			new ReportExecModal(script)
	)



################################################################################
# Script Search Global Shortcut
################################################################################

$(document).on 'keydown', (evt) ->
	if evt.key == 'f' and (evt.metaKey or evt.ctrlKey) and evt.shiftKey
		evt.stopPropagation()
		evt.preventDefault()
		showModal '/scripts/search'

################################################################################
# Script Searcher
################################################################################

window.scripts.initSearcher = ->
	new ScriptSearcher()

_searchResultsTemplate = tinyTemplate (scripts) ->
	for script in scripts
		div ".script-result#result-#{script.id}", {data: {id: script.id}}, ->
			div '.title', script.title

class ScriptSearcher
	constructor: ->
		@input = $ 'input.script-search'
		@resultsList = $ '.script-searcher .results-list'
		@bodyPane = $ '.script-searcher .body-pane'
		@resultsSummary = $ '.script-search-input .results-summary'
		@key = 0
		@scriptMap = {}
		@openScriptLink = $ '.script-searcher a.open-script'

		ace.require 'ace/ext/language_tools'
		@editor = ace.edit 'script-search-editor'
		@editor.setTheme 'ace/theme/textmate'
		@editor.setDisplayIndentGuides true
		@editor.setShowFoldWidgets false
		@editor.$blockScrolling = Infinity
		@editor.setReadOnly true
		@session = @editor.getSession()
		@session.setMode 'ace/mode/ruby'
		@session.setTabSize 2

		this.clearResult()

		setTimeout(
			=> @input.focus()
			500
		)

		@input.on 'input', => this.onInputChanged()

		$('.modal-column').on 'keydown', (evt) =>
			switch evt.keyCode
				when 38
					this.loadPrevious()
				when 40
					this.loadNext()

		@resultsList.on 'click', '.script-result', (evt) =>
			id = $(evt.currentTarget).data 'id'
			this.loadBody id

	onInputChanged: ->
		query = @input.val()
		if query.length < 3
			this.clearResult()
			return
		@key += 1
		data = {
			key: @key
			query: query
		}
		$.get(
			"/scripts/search_results.json"
			data
			(res) => this.onResult(res)
		)

	clearResult: ->
		@resultsList.html ''
		@resultsSummary.html ''
		@bodyPane.hide()
		@currentId = null
		@openScriptLink.hide()

	onResult: (res) ->
		unless parseInt(res.key) == @key
			return
		unless res.scripts.length
			this.clearResult()
			return
		for script in res.scripts
			@scriptMap[script.id] = script
		@resultsSummary.html "#{res.scripts.length} of #{res.total}"
		@resultsList.html _searchResultsTemplate(res.scripts)
		if @currentId?
			item = @resultsList.find "#result-#{@currentId}"
			if item.length
				this.loadBody @currentId
			else
				@resultsList.find('.script-result:first').click()
		else
			@resultsList.find('.script-result:first').click()

	loadBody: (id) ->
		@bodyPane.show()
		@resultsList.find('.current').removeClass 'current'
		@resultsList.find("#result-#{id}").addClass 'current'
		@openScriptLink.attr 'href', "/scripts/#{id}/edit"
		@openScriptLink.show()
		unless id == @currentId
			@currentId = id
			script = @scriptMap[id]
			@session.setValue script.body
		query = @input.val().trim()
		@editor.find query, {wholeWord: false, wrap: true}

	loadNext: ->
		currentItem = @resultsList.find('.current')
		unless currentItem.length
			return
		nextItem = currentItem.next()
		if nextItem.length
			nextItem.click()
		else
			@resultsList.find('.script-result:first').click()

	loadPrevious: ->
		currentItem = @resultsList.find('.current')
		unless currentItem.length
			return
		prevItem = currentItem.prev()
		if prevItem.length
			prevItem.click()
		else
			@resultsList.find('.script-result:last').click()



################################################################################
# Schedule Rules Editor
################################################################################

_scheduleRulePartial = (script, constants) ->
	rule = if script.schedule_rules?.length then script.schedule_rules[0] else {}
	div '.schedule-rule-editor', ->
		input '', type: 'hidden', name: 'schedule_rules_s', value: JSON.stringify([rule])
		div '.horizontal-grid', ->
			div '.stretch-column.days-column', ->
				for day in constants.days
					label '', ->
						checked = if rule.days?.indexOf(day)>-1 then 'checked' else null
						input '.day', type: 'checkbox', value: day, checked: checked
						span '', day[0..2].capitalize()
			div '.stretch-column.weeks-column', ->
				for week in constants.weeks
					label '', ->
						checked = if rule.weeks?.indexOf(week)>-1 then 'checked' else null
						input '.week', type: 'checkbox',  value: week, checked: checked
						title = if week == 'all' then 'All Weeks' else "Week #{week}"
						span '', title
			for monthGroup in constants.month_groups
				div '.stretch-column.months-column', ->
					for month in monthGroup
						label '', ->
							checked = if rule.months?.indexOf(month)>-1 then 'checked' else null
							input '.month', type: 'checkbox',  value: month, checked: checked
							span '', month[0..2].capitalize()
		a '.all-months.ion-android-done-all', 'All Months'

# ensures that the schedule_rules_s field always contains the latest value from the controls inside of @ui
class ScheduleRulesEditor
	constructor: (@ui) ->
		@output = @ui.find 'input[name=schedule_rules_s]'

		@ui.on 'change', 'input.day, input.month', =>
			this.onChange()

		@ui.on 'click', 'a.all-months', =>
			@ui.find('input.month').prop 'checked', true
			this.onChange()

		@ui.on 'change', 'input.week[value=all]', =>
			@ui.find('input.week[value!=all]').prop 'checked', false
			this.onChange()

		@ui.on 'change', 'input.week[value!=all]', =>
			@ui.find('input.week[value=all]').prop 'checked', false
			this.onChange()

		this.onChange()

	onChange: ->
		days = @ui.find('input.day:checked').map((index, elem) ->
			elem.value
		).get()
		weeks = @ui.find('input.week:checked').map((index, elem) ->
			elem.value
		).get()
		months = @ui.find('input.month:checked').map((index, elem) ->
			elem.value
		).get()
		rule = {days: days, weeks: weeks, months: months}
		puts rule
		@output.val JSON.stringify([rule])


################################################################################
# Fields Controls
################################################################################

_fieldPartial = (field, constants) ->
	div '.script-field', ->
		div '.horizontal-grid', ->
			div '.shrink-columns', ->
				div '.sort-handle.ion-android-more-vertical'
			div '.stretch-column', ->
				input '.field-name', type: 'text', value: field.name, placeholder: 'Name'
			div '.stretch-column', ->
				select '.field-field_type', ->
					forms.optionsForSelect constants.field_type_options, field.field_type
			div '.shrink-columns', ->
				a '.remove-field.ion-close-round.alert', title: 'Remove Field'

		input '.field-default_value', type: 'text', value: field.default_value, placeholder: 'Default Value'

		textarea '.field-values', type: 'text', placeholder: 'Values', rows: '1', (field.values || '')

class FieldsControls
	constructor: (@editor, container, @constants) ->
		@list = container.find '.script-fields'
		@output = container.find 'input[name=script_fields_json]'
		container.find('a.add-field').click =>
			this.addField()
		this.updateOutput()

		container.on 'change', 'input, select, textarea', =>
			this.updateOutput()
			@editor.onChanged()

		container.on 'change', '.field-field_type', (evt) ->
			typeInput = $ evt.currentTarget
			valuesInput = typeInput.parents('.script-field').find '.field-values'
			valuesInput.toggle(typeInput.val() == 'select')

		container.on 'click', 'a.remove-field', (evt) =>
			$(evt.currentTarget).parents('.script-field').remove()
			this.updateOutput()
			@editor.onChanged()

		@list.find('.script-field').each (index, elem) ->
			view = $ elem
			valuesInput = view.find '.field-values'
			valuesInput.toggle(view.find('.field-field_type').val() == 'select')

		new Sortable @list[0]

	addField: ->
		@list.append tinyTemplate(=> _fieldPartial({}, @constants))
		@list.find('.field-values:last').hide()
		this.updateOutput()

	updateOutput: ->
		fields = @list.find('.script-field').map((index, elem) ->
			view = $ elem
			data = {}
			for k in ['name', 'field_type', 'default_value', 'values']
				data[k] = view.find(".field-#{k}").val()
			data
		).get()
		@output.val JSON.stringify(fields)

	validate: ->
		@list.find('.error').removeClass 'error'
		@list.find('input.field-name').each (index, elem) ->
			input = $ elem
			unless input.val()?.length
				input.addClass 'error'
		!@list.find('.error').length


################################################################################
# Editor
################################################################################

_editorTemplate = tinyTemplate (script, constants) ->
	form '.script-editor.show-settings', ->
		div '.toolbar', ->
			a '.save.with-icon', ->
				icon '.ion-upload'
				span '', 'Save'
		div '.editor-container', ->
			div '.ace-container', script.body
			div '.syntax-error-output'
		div '.settings-container', ->
			div '.error-explanation'

			div '.settings-panel.general', ->
				h4 '.with-icon', ->
					icon '.ion-information-circled'
					span '', 'General'
				input '', type: 'text', name: 'title', value: script.title, placeholder: 'Title'
				div '.horizontal-grid', ->
					div '.stretch-column', ->
						label '', 'Category'
						select '', name: 'report_category', ->
							forms.optionsForSelect constants.category_options, script.report_category
					div '.stretch-column', ->
						label '', 'Visibility'
						select '', name: 'visibility', ->
							forms.optionsForSelect constants.visibility_options, script.visibility
				label '', 'E-Mail Recipients'
				input '', type: 'text', name: 'email_recipients_s', value: (script.email_recipients||[]).sort().join(', ')
				textarea '', name: 'description', value: script.description, placeholder: 'Description', rows: 1

			div '.settings-panel.fields', ->
				a '.right.add-field', ->
					icon '.ion-plus-round'
				h4 '.with-icon', ->
					icon '.ion-toggle-filled'
					span '', 'Fields'
				input '', type: 'hidden', name: 'script_fields_json'
				div '.script-fields', ->
					fields = script.script_fields || []
					for field in fields
						_fieldPartial field, constants

			div '.settings-panel.schedule', ->
				select '.schedule-time', name: 'schedule_time', ->
					forms.optionsForSelect constants.schedule_time_options, script.schedule_time
				h4 '.with-icon', ->
					icon '.ion-calendar'
					span '', 'Schedule'
				_scheduleRulePartial script, constants


class Editor
	constructor: (@script, @tabContainer, @constants) ->
		@ui = $(_editorTemplate(@script, @constants)).appendTo @tabContainer.getElement()

		new ScheduleRulesEditor @ui.find('.settings-panel.schedule')
		schedulePanel = @ui.find '.settings-panel.schedule'
		scheduleTimeSelect = @ui.find('select.schedule-time')
		scheduleTimeSelect.change =>
			schedulePanel.toggleClass 'collapsed', scheduleTimeSelect.val()=='none'
		scheduleTimeSelect.change()

		@hasChanges = false
		@errorExplanation = @ui.find('.error-explanation')
		@errorExplanation.hide()
		@ui.on 'change', 'input, select, textarea', =>
			@hasChanges = true
			this.updateUi()

		@buttons = {
			save: @ui.find('a.save')
		}
		@buttons.save.click =>
			this.save()

		aceContainer = @ui.find '.ace-container'
		@aceEditor = ace.edit aceContainer[0]
		@aceEditor.setTheme 'ace/theme/textmate'
		@aceEditor.setDisplayIndentGuides true
		@aceEditor.setShowFoldWidgets false
		@session = @aceEditor.getSession()
		@session.setMode 'ace/mode/ruby'
		@session.setTabSize 2
		@errorMarkerId = null
		@syntaxErrorOutput = @ui.find '.syntax-error-output'
		@syntaxErrorOutput.hide()

		@aceEditor.setOptions(
			enableBasicAutocompletion: true
			enableSnippets: true
			enableLiveAutocompletion: false
		)

		@aceEditor.on 'change', _.debounce(
			=> this.onChanged(true),
			500
		)

		@aceEditor.commands.addCommand(
			name: 'save'
			bindKey: {win: 'Ctrl-S',  mac: 'Command-S'}
			exec: (e) =>
				this.save()
		)

		@fieldsControls = new FieldsControls this, @ui.find('.fields'), @constants

		this.updateUi()

	onChanged: (checkBody=false) ->
		unless @hasChanges
			@hasChanges = true
			this.updateUi()
		if checkBody
			$.get(
				'/scripts/check'
				{body: @aceEditor.getValue()}
				(res) =>
					console.log res
					this.clearDiagnostic()
					if res.diagnostic
						this.setDiagnostic res.diagnostic
			)

	clearDiagnostic: ->
		if @errorMarkerId
			@session.removeMarker @errorMarkerId
			@errorMarkerId = null
		@syntaxErrorOutput.hide()
#		@runButton.attr 'disabled', null

	setDiagnostic: (diagnostic) ->
		Range = ace.require("ace/range").Range
		loc = diagnostic.location
		src = loc.source_buffer
		line = _.values(src.line_for_position)[0]
		cols = _.values(src.column_for_position)
		if cols.length==1
			cols.push cols[0]+1
		console.log "error on line #{line} from #{cols[0]} to #{cols[1]}"
		range = new Range(line-1, cols[0]-1, line-1, cols[1]+1)
		@errorMarkerId = @session.addMarker(range, 'syntax-error', 'error', true)
		marker = @ui.find('.ace-container .syntax-error')
		puts "marker count: #{marker.length}"
		marker.attr 'title', "#{diagnostic.reason}: #{diagnostic.arguments.token}"
		@syntaxErrorOutput.show().text "#{diagnostic.reason}: #{diagnostic.arguments.token}"
#		@runButton.attr 'disabled', 'disabled'

	updateUi: ->
		@buttons.save.toggleClass 'disabled', !@hasChanges

	serialize: ->
		unless @fieldsControls.validate()
			return null
		data = @ui.serializeObject()
		data.body = @aceEditor.getValue()
		data

	save: ->
		onDone = (res) =>
			if res.status == 'success'
				@script = res.script
				@errorExplanation.text('').hide()
				@ui.find('.error').removeClass 'error'
				@hasChanges = false
				this.updateUi()
			else
				puts res.script
				puts res.errors
				@ui.showErrors res.errors
				alert res.message

		data = this.serialize()
		unless data?
			return
		if @script.id?.length
			$.put(
				"/scripts/#{@script.id}.json"
				{script: data}
				onDone
			)
		else
			$.post(
				'/scripts.json'
				{script: data}
				onDone
			)


################################################################################
# Script Workspace
################################################################################

window.scripts.initWorkspace = (sel) ->
	new Workspace $(sel)

class Workspace
	constructor: (@container) ->
		@container.addClass 'script-workspace'
		ace.require 'ace/ext/language_tools'

		$.get(
			'/scripts/constants.json'
			(res) =>
				if res.status == 'success'
					this.init res.constants
				else
					alert res.message
		)

	init: (@constants) ->
		config = {
			content: [{
				type: 'stack'
				content: [
					{
						type: 'component'
						title: 'New Script'
						componentName: 'editor'
					}
				]
			}]
		}
		@layout = new GoldenLayout config, @container[0]

		@scriptMap = {}

		@layout.registerComponent 'editor', (container, state) =>
			puts "tab container: ", container
			if state?.id?.length
				$.get(
					"/scripts/#{state.id}.json"
					(res) =>
						if res.status == 'success'
							@scriptMap[res.script.id] = res.script
							editor = new Editor(res.script, container, @constants)
						else
							alert res.message
				)
			else # new script
				editor = new Editor({title: 'New Script'}, container, @constants)

		@layout.init()

		@container.find('lm_goldenlayout').append "<a class='with-icon open-script'><i class='ion-android-folder-open'/>Open</a>"

		$('a.open-script').click =>
			new PickerModal (script) =>
				child = {
					type: 'component'
					title: script.title
					componentName: 'editor'
					componentState: {id: script.id}
				}
				unless @layout.root.contentItems.length
					@layout.root.addChild {
						type: 'stack'
					}
				@layout.root.contentItems[0].addChild child
			false


################################################################################
# Picker Modal
################################################################################

_pickerTemplate = tinyTemplate (scripts) ->
	div '.script-picker', ->
		table '.scripts.sticky-header.sortable.data.sortable', ->
			thead '', ->
				tr '', ->
					th '', ->
						a '', data: {column: 'created_at'}, 'Created On'
						a '', data: {column: 'updated_at'}, 'Updated On'
					th '', ->
						a '', data: {column: 'title'}, 'Title'
					th '', ->
						a '', data: {column: 'created_by_name'}, 'Created By'
					th '', ->
						a '', data: {column: 'report_category'}, 'Category'
						a '', data: {column: 'updated_at'}, 'Visibility'
					th '', ->
						a '', data: {column: 'num_runs'}, '# Runs'
						a '', data: {column: 'last_run'}, 'Last Run'
			tbody '', ->
				for script in scripts
					tr ".script##{script.id}", ->
						td '', ->
							div '.col-created_at', script.created_at.formatShortDate()
							div '.col-updated_at', script.updated_at.formatShortDate()
						td '', ->
							div '.col-title', script.title
							if script.schedule_time != 'none' and script.schedule_rule_summaries?.length
								emailRecipients = if script.email_recipients?.length
									script.email_recipients.replace('{', '').replace('}', '')
								else
									null
								div '.schedule.with-icon', ->
									if emailRecipients?
										icon '.ion-email', title: emailRecipients
									span '', script.schedule_rule_summaries.replace('{', '').replace('}', '').replace(/"/g, '')
						td '.col-created_by_name', script.created_by_name
						td '', ->
							div '.col-report_category', script.report_category.titleize()
							div '.col-visibility', script.visibility.titleize()
						td '', ->
							div '.col-num_runs', script.num_runs.toString()
							div '.col-last_run', if script.last_run?.length then script.last_run.formatShortDate() else ''



class PickerModal
	constructor: (@callback) ->
		$.get(
			"/scripts.json"
			(res) =>
				if res.status == 'success'
					tinyModal.showDirect _pickerTemplate(res.scripts), {
						title: "Select Script"
						title_icon: 'ios-folder-outline'
						callback: (modal) => this.init(res.scripts, modal)
					}
				else
					alert res.message
		)

	init: (@scripts, @ui) ->
		@scriptMap = {}
		for script in @scripts
			@scriptMap[script.id] = script
		@ui.find('tr.script').click (evt) =>
			script = @scriptMap[evt.currentTarget.id]
			@callback script
			tinyModal.close()
