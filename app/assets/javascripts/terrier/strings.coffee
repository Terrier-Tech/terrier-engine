
window.puts = (args...) ->
	window.console.log args...

########################################################################################
# Maths
########################################################################################

window.hashCode = (s) ->
	hash = 0
	i = 0
	len = s.length
	while ( i < len )
		hash = ((hash << 5) - hash + this.charCodeAt(i++)) << 0
	return hash

String::hashCode = ->
	window.hashCode this

window.leftPad = (s, width) ->
	s += ''
	if s.length >= width
		s
	else
		new Array(width - s.length + 1).join('0') + s


########################################################################################
# Formatting
########################################################################################

_upcaseValues = ['cod', 'csr', 'html', 'pdf', 'ach', 'eft', 'wdi', 'wdo']
_upcaseBlacklist = ['at', 'by', 'to', 'is', 'or', 'of']

# only capitalizes the first character
window.capitalize = (s) ->
	unless s?
		return ''
	if (s.length < 3 and _upcaseBlacklist.indexOf(s) < 0) or _upcaseValues.indexOf(s)>-1
		return s.toUpperCase()
	s && s[0].toUpperCase() + s.slice(1)

String::capitalize = ->
	window.capitalize this

# capitalizes every word
window.titleize = (s) ->
	unless s?
		return ''
	s = s.toString()
	if s == '_state'
		return s
	comps = s.split(/[\s_-]/g)
	capitalized = _.map comps, (c) -> window.capitalize(c)
	capitalized.join ' '

String::titleize = ->
	window.titleize this

# converts the string to camel-case
window.camelize = (s) ->
	unless s?
		return ''
	s.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) ->
		chr.toUpperCase()
	)

String::camelize = ->
	window.camelize this

# convert to lower case and join with underscores
window.underscore = (s) ->
	unless s?
		return ''
	s = s.toString()
	comps = s.split(/[\s_]/g)
	lowecased = _.map comps, (c) -> c.toLowerCase()
	lowecased.join('_')

String::underscore = ->
	window.underscore this

window.withoutParens = (s) ->
	unless s?
		return ''
	s.replace(/\([\w\s]+\)/g, '').trim()

String::withoutParams = ->
	window.withoutParens this

window.formatCommas = (n) ->
	"#{ n }".replace(/\B(?=(\d{3})+(?!\d))/g, ",") # add commas in the thousands places

window.formatCents = (cents, showCents=true) ->
	dollars = ''
	sign = if cents < 0 then '-' else ''
	if showCents == 'nonZero'
		showCents = cents % 100
	if showCents
		dollars = "#{sign}$#{(Math.abs(cents) / 100.0).toFixed(2)}"
	else
		dollars = "$#{sign}#{(Math.abs(cents) / 100.0).toFixed(0)}"
	window.formatCommas(dollars)

Number::formatCommas = () ->
	window.formatCommas this

String::formatCommas = () ->
	window.formatCommas this

Number::formatCents = (showCents=true) ->
	window.formatCents this, showCents

String::formatCents = (showCents=true) ->
	window.formatCents this, showCents

window.formatDollars = (dollars, showCents=true) ->
	window.formatCents(dollars*100, showCents)

Number::formatDollars = (showCents=true) ->
	window.formatDollars this, showCents

String::formatDollars = (showCents=true) ->
	window.formatDollars this, showCents

window.formatMinutes = (minutes) ->
	hours = Math.floor(minutes / 60)
	if hours > 24
		days = Math.floor(hours / 24)
		hours = hours % 24
		return "#{days}d #{hours}h"
	mins = (minutes % 60).toFixed(0)
	if hours > 0
		"#{hours}h #{mins}m"
	else
		"#{mins}m"

Number::formatMinutes = ->
	window.formatMinutes this

String::formatMinutes = ->
	window.formatMinutes this

# ensures that num is at least size wide, filling with zeros to the left
window.zeroPad = (num, size) ->
	s = num + ''
	while (s.length < size)
		s = '0' + s
	s

Number::zeroPad = (size) ->
	window.zeroPad this, size

String::zeroPad = (size) ->
	window.zeroPad this, size

# represents a number in thousands in a k at the end
window.thousandize = (num) ->
	abs = Math.abs(num)
	if abs < 1000
		return num.toFixed(0)
	if abs < 10000
		return (num/1000.0).toFixed(1) + 'k'
	if abs < 1000000
		return (num/1000.0).toFixed(0) + 'k'
	(num/1000000.0).toFixed(2) + 'M'

Number::thousandize = ->
	window.thousandize this

String::thousandize = ->
	window.thousandize this

window.formatPhone = (s) ->
	if s.match(/^\d{10}$/) # no dashes or spaces
		"#{s[0..2]}-#{s[3..5]}-#{s[6..9]}"
	else
		s.toString()

String::formatPhone = ->
	window.formatPhone this

window.formatPhoneAndType = (phone, type) ->
	s = window.formatPhone phone
	if type?.length
		"#{window.titleize(type)}: #{s}"
	else
		s

String::formatPhoneAndType = (type) ->
	window.formatPhoneAndType this, type

window.formatEmails = (emails) ->
	unless emails?.length
		return ''
	emails.split(window.emailSplitRegex).join(', ')

String::formatEmails = ->
	window.formatEmails this

window.formatShortDate = (s) ->
	unless s.endsWith('Z') or s.match(/-\d{2}:\d{2}$/)
		s += ' UTC'
	d = new Date(s)
	"#{leftPad(d.getMonth()+1, 2)}/#{leftPad(d.getDate(), 2)}/#{d.getFullYear().toString().substring(2)}"

String::formatShortDate = ->
	window.formatShortDate this

window.formatSortableDate = (s) ->
	unless s.endsWith('Z') or s.match(/-\d{2}:\d{2}$/)
		s += ' UTC'
	d = new Date(s)
	d.formatSortableDate()

Date::formatSortableDate = ->
	"#{this.getFullYear().toString()}-#{leftPad(this.getMonth()+1, 2)}-#{leftPad(this.getDate(), 2)}"

String::formatSortableDate = ->
	window.formatSortableDate this

window.formatShortDateTime = (s) ->
	unless s.endsWith('Z') or s.match(/-\d{2}:\d{2}$/)
		s += ' UTC'
	d = new Date(s)
	s = "#{leftPad(d.getMonth()+1, 2)}/#{leftPad(d.getDate(), 2)}/#{d.getFullYear().toString().substring(2)} "
	s + d.toLocaleTimeString()

String::formatShortDateTime = ->
	window.formatShortDateTime this

window.formatShortTime = (s) ->
	unless s.endsWith('Z') or s.match(/-\d{2}:\d{2}$/)
		s += ' UTC'
	d = new Date(s)
	d.toLocaleTimeString()

String::formatShortTime = ->
	window.formatShortTime this


########################################################################################
# Singular/Plural
########################################################################################

# pluralize a word if num is greater than 1
window.pluralize = (num, word) ->
	if num.toString() == "1" or !word?
		return word
	lowerWord = word.toString().toLowerCase()
	lastChar = lowerWord.charAt(lowerWord.length-1)
	if lowerWord.endsWith('ice') or lastChar == 's'
		return word
	else if lastChar == 'h' and lowerWord != 'month'
		return word + 'es'
	else if lowerWord.endsWith('ey') or lowerWord.endsWith('ay')
		return word + 's'
	else if lastChar == 'y'
		return lowerWord.substring(0, word.length-1) + 'ies'
	else
		return word + 's'

String::pluralize = (num=2) ->
	window.pluralize num, this

# only singularizes the word if num is 1
window.singularize = (num, word) ->
	unless num.toString() == '1'
		return word
	if word.endsWith('ice')
		word.replace('ice', 'ouse')
	else if word.endsWith('lies')
		word.replace('lies', 'ly')
	else if word.endsWith('les')
		word.replace('les', 'le')
	else if word.endsWith('kes')
		word.replace('kes', 'ke') # snakes
	else if word.endsWith('es')
		word.replace('es', '')
	else if word.endsWith('s')
		word.replace(/s$/, '')
	else
		word

String::singularize = (num=1) ->
	window.singularize num, this


########################################################################################
# Possessive Noun Apostrophe
########################################################################################

window.possessiveize = (s) ->
	if s.endsWith('s') then s.replace(/s$/, "s'") else "#{s}'s"

String::possessiveize = ->
	window.possessiveize this


########################################################################################
# Words and Sentences
########################################################################################

# creates an abbreviation using the first letters of each word in s
window.abbreviate = (s) ->
	(for w in s.split(' ')
		w.substring(0,2)).join('')

String::abbreviate = ->
	window.abbreviate this

# joins the strings with commas in an englishy way (i.e. no comma for two, an 'and' for more than two)
window.joinWithCommas = (comps) ->
	if !comps? or comps.length == 0
		return ''
	if comps.length == 1
		return comps[0]
	if comps.length == 2
		return comps.join(' and ')
	comps = _.clone(comps)
	comps[comps.length-1] = 'and ' + comps[comps.length-1]
	comps.join(', ')

Array::joinWithCommas = ->
	window.joinWithCommas this

# replace all newlines in the string with break tags
window.newlinesToBreaks = (s) ->
	(s || '').replace(/\n/g, "<br/>")

String::newlinesToBreaks = ->
	window.newlinesToBreaks this


########################################################################################
# Paragraphs
########################################################################################

# splits a string into paragraphs based on newlines
window.splitParagraphs = (s) ->
	s.split(/\n\n/g)

String::splitParagraphs = ->
	window.splitParagraphs this


########################################################################################
# Validations
########################################################################################

window.emailSplitRegex = /[\s,;]+/

# validate an email address string
window.validateEmail = (s) ->
	regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
	regex.test(s)

window.validateEmailLoosely = (email) ->
	regex = /[^\s@]+@[^\s@]+\.[^\s;,@]+/
	return regex.test(email)


String::validateEmail = ->
	window.validateEmail this

String::validateEmailLoosely = ->
	window.validateEmailLoosely this



########################################################################################
# Booleans
########################################################################################

_trueStrings = ['1', 'on', 'true']

String::isTrue = ->
	this? and _trueStrings.includes(this.toLowerCase())

Boolean::isTrue = ->
	this