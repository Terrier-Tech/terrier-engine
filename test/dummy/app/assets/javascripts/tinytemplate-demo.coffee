window.tinyTemplateDemo = {}


_template = tinyTemplate (state) ->
	div '.tinytemplate-demo', style: 'padding: 1em;', ->
		p '', 'Click the button below to increment the counter.'
		div '.horizontal-grid', ->
			div '.shrink-column', ->
				input '#stateful', type: 'text', name: 'stateful', placeholder: 'This should persist', value: '4'
			div '.shrink-column', ->
				button '.increment', 'Increment'
			div '.stretch-column', ->
				div '.readonly-field', ->
					span '', 'Count: '
					span '.count', state.count.toString()

window.tinyTemplateDemo.show = (container) ->
	state = {
		count: 0
	}
	tinyRender container, _template(state)

	step = ->
		state.count += 1
		tinyRender container, _template(state)

	$(container).on 'click', 'button.increment', step
	setInterval step, 1000