window.scripts = {}


_scheduleDaysDisplay = (days) ->
	if !days or days.length == 0
		return 'never'
	if days.length == 7
		return 'every day'
	'on ' + window.joinWithCommas(days)


################################################################################
# Messages List
################################################################################

class MessagesList
	constructor: (@ui) ->
		@buffer = []
		scrollParent = @ui.parents('.modal-content')
		unless scrollParent.length
			scrollParent = @ui
		this.scrollToBottom = _.debounce(
			-> scrollParent.scrollTop(scrollParent[0].scrollHeight)
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

	cancel: ->
		@shouldCancel = true

	run: ->
		@listener.beforeRun()

		@shouldCancel = false

		url = '/scripts_streaming/exec.json'
		if @script.id?.length
			url += "?id=#{@script.id}"

		data = {body: @script.body}
		if @fieldValues?
			data.field_values = @fieldValues

		theListener = @listener

		onDone = ->
			theListener.afterRun()

		self = this
		onChunk = (rawChunk) ->
			if self.shouldCancel
				console.log "Cancelling!!"
				self.listener.afterRun()
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
# Report Exec Modal
################################################################################

_fieldControls = {}

_fieldControls.date = (name, value, options) ->
	date = if typeof value == 'number'
		new Date(value).formatSortableDate()
	else if value?.length
		value.formatSortableDate()
	else
		''
	"<input type='date' name='#{name}' value='#{date}'/>"

_fieldControls.string = (name, value, options) ->
	"<input type='text' name='#{name}' value='#{value}'/>"

_fieldControls.select = (name, value, options) ->
	s = "<select name='#{name}'>"
	for opt in options
		selected = if opt == value then 'selected="selected"' else ''
		s += "<option value='#{opt}' #{selected}>#{opt}</option>"
	s + '</select>'

_fieldControls.csv = (name, value, options) ->
	"<input type='file' name='#{name}' accept='text/csv'/>"

_reportExecModalTemplate = window.tinyTemplate (script, fieldValues, fieldOptions) ->
	div '.script-report-exec-modal.horizontal-grid', ->
		div '.shrink-column.io-column', ->
			div '.fixed-controls', ->
				if script.description?.length
					p '.description', script.description
				h4 '.with-icon', ->
					icon '.ion-ios-upload-outline'
					span '', 'Inputs'
				div '.script-field-controls', ->
					fields = JSON.parse script.script_fields_json
					for field in fields
						value = fieldValues[field.name]
						options = fieldOptions[field.name]
						div '.field-controls', ->
							label '', field.name
							puts "value for #{field.name} is #{value}"
							div '', _fieldControls[field.field_type](field.name, value, options)
				h4 '.with-icon', ->
					icon '.ion-ios-copy-outline'
					span '', 'Files'
				div '.output-files'
		div '.stretch-column', ->
			h4 '.with-icon', ->
				icon '.ion-ios-download-outline'
				span '', 'Output'
			div '.script-messages'


class ReportExecModal
	constructor: (@script, @constants, @options={}) ->
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
				modalOptions = {
					title: @script.title
					title_icon: 'play'
					actions: [
						{
							title: 'Cancel'
							icon: 'close-round'
							class: 'alert cancel'
						}
						{
							title: 'Run'
							icon: 'play'
							class: 'primary run'
						}
					]
					callback: (modal) =>
						this.init modal
				}
				if @script.id?.length and !@options.hide_settings
					modalOptions.actions.push {
						title: 'History'
						class: 'show-history secondary'
						icon: 'clock'
						end: true
					}
					modalOptions.actions.push {
						title: 'Settings'
						class: 'show-settings secondary'
						icon: 'compose'
						end: true
					}
				tinyModal.showDirect(
					content
					modalOptions
				)
		)

	init: (@ui) ->
		@buttons = {
			run: @ui.find('a.run')
			cancel: @ui.find('a.cancel')
			history: @ui.find('a.show-history')
			settings: @ui.find('a.show-settings')
		}
		@buttons.run.click (evt) =>
			this.run()
			false
		@buttons.cancel.attr 'disabled', true

		@buttons.history.click =>
			new RunsModal(@script.id)

		@buttons.settings.click =>
			new SettingsModal(@script, @constants)

		@messagesList = new MessagesList(@ui.find('.script-messages'))
		@ioControls = @ui.find '.io-column .fixed-controls'
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
		actuallyRun = _.after inputs.length, =>
			if @ui.find('.error').length > 0
				return
			runner.fieldValues = fieldValues
			runner.run()

		@buttons.cancel.unbind('click').click ->
			runner.cancel()

		unless inputs.length
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
		@ioControls.showLoadingOverlay()
		@buttons.cancel.attr 'disabled', null
		@buttons.run.attr 'disabled', true

	onChunks: (chunks) ->
		for chunk in chunks
			if chunk.type == 'file'
				this.addOutputFile chunk
			else
				@messagesList.addBuffered chunk
		@messagesList.flushBuffer()
		@messagesList.scrollToBottom()

	afterRun: ->
		@ioControls.removeLoadingOverlay()
		@buttons.cancel.attr 'disabled', true
		@buttons.run.attr 'disabled', null

	clearOutputFiles: ->
		@outputFilesView.html ''

	addOutputFile: (file) ->
		fileName = _.last file.body.split('/')
		@outputFilesView.append "<a class='file with-icon' href='#{file.body}' target='_blank'><i class='ion-document'></i>#{fileName}</a>"


window.scripts.newReportExecModal = (script, constants, options={}) ->
	new ReportExecModal script, constants, options


################################################################################
# Script Search Global Shortcut
################################################################################

$(document).on 'keydown', (evt) ->
	if evt.key == 'f' and (evt.metaKey or evt.ctrlKey) and evt.shiftKey
		evt.stopPropagation()
		evt.preventDefault()
		new ScriptSearcher()

$(document).on 'click', 'a.search-scripts', ->
	new ScriptSearcher()


################################################################################
# Script Searcher
################################################################################

window.scripts.initSearcher = ->
	new ScriptSearcher()

_searcherTemplate = tinyTemplate ->
	div '.script-searcher', ->
		div '.results-list'
		div '.body-pane#script-search-editor'
		a '.open-script.ion-android-open', title: 'Open Script'

_searchInputTemplate = tinyTemplate ->
	div '.script-search-input', ->
		input '.script-search', type: 'text', placeholder: 'Search the source code of all scripts'
		div '.results-summary'

_searchResultsTemplate = tinyTemplate (scripts) ->
	for script in scripts
		div ".script-result#result-#{script.id}", {data: {id: script.id}}, ->
			div '.title', script.title

class ScriptSearcher
	constructor: ->
		tinyModal.showDirect _searcherTemplate(), {
			title: 'Script Search'
			title_icon: 'ios-search-strong'
			callback: (modal) => this.init(modal)
		}

	init: (@ui) ->
		@ui.find('.modal-header').append _searchInputTemplate()

		@input = @ui.find 'input.script-search'
		@resultsList = @ui.find '.results-list'
		@bodyPane = @ui.find '.body-pane'
		@resultsSummary = @ui.find '.script-search-input .results-summary'
		@key = 0
		@scriptMap = {}
		@openScriptLink = @ui.find 'a.open-script'

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

		@openScriptLink.click =>
			id = @openScriptLink.data 'id'
			title = @openScriptLink.attr 'title'
			scripts.open {id: id, title: title}


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
		@openScriptLink.data 'id', id
		@openScriptLink.show()
		unless id == @currentId
			@currentId = id
			script = @scriptMap[id]
			@session.setValue script.body
			@openScriptLink.attr 'title', script.title
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
	rule = if script.schedule_rules?.length
		script.schedule_rules[0]
	else if script.schedule_rules_s?.length
		JSON.parse(script.schedule_rules_s)[0]
	else
		{}
	div '.schedule-rule-editor', ->
		input '', type: 'hidden', name: 'schedule_rules_s', value: JSON.stringify([rule])
		div '.horizontal-grid', ->
			div '.shrink-column.days-column', ->
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
						title = switch week
							when 'all'
								'All Weeks'
							when 'every_2'
								'Every 2'
							else
								"Week #{week}"
						span '', title
			for monthGroup in constants.month_groups
				div '.shrink-column.months-column', ->
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
				input '.field-name', type: 'text', value: field.name, placeholder: 'Name', autocomplete: false
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
			fieldType = view.find('.field-field_type').val()
			view.find('.field-default_value').toggle(fieldType != 'csv')
			view.find('.field-values').toggle(fieldType == 'select')

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
			a '.toggle-settings', ->
				icon '.ion-arrow-left-c'
			a '.save.with-icon', ->
				icon '.ion-upload'
				span '', 'Save <span class="shortcut">&#8984S</span>'
			a '.run.with-icon', ->
				icon '.ion-play'
				span '', 'Run <span class="shortcut">&#8984&#9166</span>'
		div '.editor-container', ->
			div '.ace-container' #, script.body
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
					if constants.report_type_options?.length
						div '.stretch-column', ->
							label '', 'Report Type'
							select '', name: 'report_type', ->
								forms.optionsForSelect constants.report_type_options, script.report_type
					div '.stretch-column', ->
						label '', 'Visibility'
						select '', name: 'visibility', ->
              forms.optionsForSelect constants.visibility_options, script.visibility
    label '', 'E-Mail Recipients'
				input '', type: 'text', name: 'email_recipients_s', value: (script.email_recipients||[]).sort().join(', ')
				textarea '', name: 'description', placeholder: 'Description', rows: 2, script.description

    if constants.added_fields.length
      for field in constants.added_fields
        options = field.options
        key = field.key
        div '.stretch-column', ->
          label '', field.title
          if field.text_field
            input '', type: 'text', name: key, value: script[key]
          else
            select '', name: key, ->
              forms.optionsForSelect options, script[key]

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

		@ui.find('a.toggle-settings').click =>
			@ui.toggleClass 'show-settings'

		@hasChanges = false
		@errorExplanation = @ui.find('.error-explanation')
		@errorExplanation.hide()
		@ui.find('.settings-container').on 'change', 'input, select, textarea', (evt) =>
			puts "changed", evt
			@hasChanges = true
			this.updateUi()

		@buttons = {
			save: @ui.find('a.save')
			run: @ui.find('a.run')
		}
		@buttons.save.click =>
			this.save()
		@buttons.run.click =>
			this.run()

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

		@session.setValue(@script.body || '')

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

		@aceEditor.commands.addCommand(
			name: 'run'
			bindKey: {win: 'Ctrl-Enter',  mac: 'Command-Enter'}
			exec: (e) =>
				this.run()
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
		@buttons.run.attr 'disabled', null

	setDiagnostic: (diagnostic) ->
		Range = ace.require("ace/range").Range
		loc = diagnostic.location
		src = loc.source_buffer
		line = _.values(src.line_for_position)[0]
		cols = _.values(src.column_for_position)
		if cols.length==1
			cols.push cols[0]+1
		puts "error on line #{line} from #{cols[0]} to #{cols[1]}"
		range = new Range(line-1, cols[0]-1, line-1, cols[1]+1)
		@errorMarkerId = @session.addMarker(range, 'syntax-error', 'error', true)
		marker = @ui.find('.ace-container .syntax-error')
		marker.attr 'title', "#{diagnostic.reason}: #{diagnostic.arguments.token}"
		@syntaxErrorOutput.show().text "#{diagnostic.reason}: #{diagnostic.arguments.token}"
		@buttons.run.attr 'disabled', 'disabled'

	updateUi: ->
		@buttons.save.toggleClass 'disabled', !@hasChanges
		title = @ui.find('input[name=title]').val()
		unless title?.length
			title = 'Untitled'
		if @hasChanges
			title += '*'
		@tabContainer.setTitle title


	serialize: ->
		unless @fieldsControls.validate()
			return null
		if @syntaxErrorOutput.is(':visible')
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
				@tabContainer.setState {id: @script.id}
				_workspace.saveState()
			else
				puts res.script
				puts res.errors
				@ui.showErrors res.errors
				alert res.message

		data = this.serialize()
		unless data?
			return "Fix errors before saving"
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

	run: ->
		data = this.serialize()
		unless data?
			return alert "Fix errors before running"
		data.id = @script.id
		new ReportExecModal(data, @constants, @options)



################################################################################
# Script Workspace
################################################################################

_workspaceStateKey = 'scripts_workspace_state'

_workspace = null

window.scripts.initWorkspace = (sel) ->
	new Workspace $(sel)

class Workspace
	constructor: (@container) ->
		@container.addClass 'script-workspace'
		ace.require 'ace/ext/language_tools'
		_workspace = this

		$.get(
			'/scripts/constants.json'
			(res) =>
				if res.status == 'success'
					this.init res.constants
				else
					alert res.message
		)

	init: (@constants) ->
		config = this.getSavedStated()
		@layout = new GoldenLayout config, @container[0]

		@scriptMap = {}
		@itemMap = {}

		@layout.registerComponent 'editor', (container, state) =>
			if state?.id?.length
				$.get(
					"/scripts/#{state.id}.json"
					(res) =>
						if res.status == 'success'
							@scriptMap[res.script.id] = res.script
							@itemMap[res.script.id] = container
							editor = new Editor(res.script, container, @constants)
						else
							alert res.message
				)
			else # new script
				editor = new Editor({title: 'New Script'}, container, @constants)

		@layout.on 'itemDestroyed', (evt) =>
			id = evt.config?.componentState?.id
			if id?.length
				puts "Script #{id} was closed"
				delete @itemMap[id]

		@layout.init()

		@layout.on 'stateChanged', =>
			this.saveState()

		@container.find('.lm_goldenlayout').append "<a class='with-icon open-script'><i class='ion-android-folder-open'/>Open</a>"

		$('a.open-script').click =>
			new PickerModal (script) =>
				this.openScript script
			false

		$('a.new-script').click =>
			this.addChild {
				type: 'component'
				title: 'New Script'
				componentName: 'editor'
			}
			false

	# script only needs id and title attributes
	openScript: (script) ->
		if @itemMap[script.id] # the script is already open
			puts "script already open"
			item = @itemMap[script.id]
			# doesn't work
			item.parent.header?.parent?.setActiveContentItem item
		else
			this.addChild {
				type: 'component'
				title: script.title
				componentName: 'editor'
				componentState: {id: script.id}
			}

	addChild: (child) ->
		unless @layout.root.contentItems.length
			@layout.root.addChild {
				type: 'stack'
			}
		@layout.root.contentItems[0].addChild child


	saveState: ->
		config = @layout.toConfig()
		puts "Saving script worksapce state: ", config
		localStorage.setItem _workspaceStateKey, JSON.stringify(config)

	getSavedStated: ->
		config = localStorage.getItem _workspaceStateKey
		if config?.length
			try
				return JSON.parse config
			catch
				puts "Error parsing workspace saved state, using default"
		{
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

window.scripts.open = (script) ->
	if window.location.pathname.indexOf('/scripts')==0 and _workspace?
		_workspace.openScript script
		tinyModal.close()
	else
		Turbolinks.visit "/scripts##{script.id}"



################################################################################
# Picker Modal
################################################################################

_pickerTemplate = tinyTemplate (scripts) ->
	div '.script-picker', ->
		table '.scripts.sticky-header.sortable.data.sortable.plain-header', ->
			thead '', ->
				tr '', ->
					th '', ->
						a '', data: {column: 'created_at'}, 'Created'
						a '', data: {column: 'updated_at'}, 'Updated'
					th '', ->
						a '', data: {column: 'title'}, 'Title'
					th '', ->
						a '', data: {column: 'created_by_name'}, 'Created By'
					th '', ->
						a '', data: {column: 'report_category'}, 'Category'
						a '', data: {column: 'visibility'}, 'Visibility'
					th '', ->
						a '', data: {column: 'num_runs'}, '# Runs'
						a '', data: {column: 'last_run'}, 'Last Run'
			tbody '', ->
				for script in scripts
					tr ".script##{script.id}", data: {title: script.title.toLowerCase()}, ->
						td '', ->
							div '.col-created_at', data: {col_value: script.created_at}, script.created_at.formatShortDate()
							div '.col-updated_at', data: {col_value: script.updated_at}, script.updated_at.formatShortDate()
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

		# add the filter input to the header
		filterInput = $('<input type="text" class="script-picker-filter" placeholder="Filter"/>').appendTo @ui.find('.modal-header')
		filterInput.focus()
		filterInput.keyup =>
			s = (filterInput.val() || '').toLowerCase()
			console.log "filter '#{s}'"
			unless s.length
				@ui.find('tr.script').show()
				return
			@ui.find('tr.script').each (index, elem) ->
				row = $(elem)
				title = row.data('title')
				row.toggle(title.indexOf(s) > -1)



################################################################################
# Runs Modal
################################################################################

_fieldValuesPartial = (fields) ->
	if typeof fields == 'string'
		fields = JSON.parse fields
	for k, v of fields
		div '.field', ->
			span '.key', "#{k}: "
			vString = if v.match(/\d{4}-\d{2}-\d{2}/)
				v.formatShortDate()
			else
				v
			span '.value', vString

_runsTemplate = tinyTemplate (runs) ->
	div '.script-runs-modal', ->
		table '.data.script-runs', ->
			thead '', ->
				tr '', ->
					th '', 'Date / Time'
					th '', 'User / Duration'
					th '', 'Inputs'
					th '', 'Status'
					th '', 'Exception'
					th ''
			tbody '', ->
				for run in runs
					tr '.script-run', ->
						td '', ->
							div '.date', run.created_at.formatShortDate()
							div '.time', run.created_at.formatShortTime()
						td '', ->
							div '.created-by', run.created_by_name
							div '.duration', "#{(run.duration || 0).toFixed(1)}s"
						td '', ->
							if run.fields
								_fieldValuesPartial(run.fields)
						td ".status.#{run.status}", run.status.titleize()
						td '.exception', run.exception || ''
						td '.inline-actions', ->
							a '.with-icon', href: run.log_url, target: '_blank', ->
								icon '.ion-ios-list-outline'
								span '', 'Log'


class RunsModal
	constructor: (@id) ->
		$.get(
			"/scripts/#{@id}/runs.json"
			(res) =>
				if res.status == 'success'
					tinyModal.showDirect(
						_runsTemplate(res.runs)
						{
							title: 'Script Runs'
							title_icon: 'clock'
						}
					)
				else
					alert res.message
		)


################################################################################
# Settings Modal
################################################################################

_settingsFormTemplate = tinyTemplate (script, constants) ->
	form '.script-settings', ->
		div '.error-explanation'
		div '.horizontal-grid', ->
			div '.stretch-column', ->
				input '', type: 'text', name: 'title', placeholder: 'Title', value: script.title
				div '.horizontal-grid', ->
					div '.stretch-column', ->
						label '', 'Category'
						select '', name: 'report_category', ->
							forms.optionsForSelect constants.category_options, script.report_category
					div '.stretch-column', ->
						label '', 'E-Mail Recipients'
						input '', type: 'text', name: 'email_recipients_s', value: script.email_recipients_s
				label '', 'Description'
				textarea '', name: 'description', rows: '4', script.description
			div '.shrink-column.schedule-column', ->
				h3 '.with-icon', ->
					icon '.ion-ios-calendar-outline'
					span '', 'Schedule'
				select '.schedule-time', name: 'schedule_time', ->
					forms.optionsForSelect constants.schedule_time_options, script.schedule_time
				_scheduleRulePartial script, constants


class SettingsModal
	constructor: (@script, @constants) ->
		puts "editing script: ", @script
		unless @script.email_recipients_s?.length
			@script.email_recipients_s = (@script.email_recipients || []).join(', ')
		tinyModal.showDirect(
			_settingsFormTemplate(@script, @constants)
			{
				title: 'Script Settings'
				title_icon: 'ios-gear-outline'
				actions: [
					{
						title: 'Save'
						icon: 'checkmark-round'
						class: 'save-script'
					}
				]
				callback: (modal) => this.init modal
			}

		)

	init: (@ui) ->
		new ScheduleRulesEditor @ui.find('.schedule-column')

		@form = @ui.find 'form'
		@errorExplanation = @ui.find '.error-explanation'
		@errorExplanation.hide()
		@ui.find('a.save-script').click =>
			this.save()

	save: ->
		@errorExplanation.hide()
		data = @form.serializeObject()
		@ui.showLoadingOverlay()
		$.put(
			"/scripts/#{@script.id}.json"
			{script: data}
			(res) =>
				if res.status == 'success'
					Turbolinks.visit window.location
				else
					@ui.removeLoadingOverlay()
					puts res.script
					puts res.errors
					@form.showErrors res.errors
		)