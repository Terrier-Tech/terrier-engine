window.loggingTest = {}

class TestClass
	constructor: (container) ->
		tinyLogger.init this, output: container
		this.run()

	run: ->
		n = 50
		for i in [0..n]
			@info "#{i} of #{n}", i
		try
			throw "This is an error!"
		catch ex
			@error ex


window.loggingTest.run = (container) ->
	new TestClass(container)

