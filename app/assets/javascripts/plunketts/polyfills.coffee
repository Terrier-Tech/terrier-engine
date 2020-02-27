if jQuery?
	for method in [ "put", "delete" ]
		jQuery[method] = ( url, data, callback, type ) ->
			if jQuery.isFunction( data )
				type = type || callback
				callback = data
				data = undefined
	
			return jQuery.ajax(
				url: url
				type: method
				dataType: type
				data: data
				success: callback
			)

# String.repeat
if !String::repeat
	String::repeat = (count) ->
		'use strict'
		if this == null
			throw new TypeError('can\'t convert ' + this + ' to object')
		str = '' + this
		count = +count
		if count != count
			count = 0
		if count < 0
			throw new RangeError('repeat count must be non-negative')
		if count == Infinity
			throw new RangeError('repeat count must be less than infinity')
		count = Math.floor(count)
		if str.length == 0 or count == 0
			return ''
		# Ensuring count is a 31-bit integer allows us to heavily optimize the
		# main part. But anyway, most current (August 2014) browsers can't handle
		# strings 1 << 28 chars or longer, so:
		if str.length * count >= 1 << 28
			throw new RangeError('repeat count must not overflow maximum string size')
		maxCount = str.length * count
		count = Math.floor(Math.log(count) / Math.log(2))
		while count
			str += str
			count--
		str += str.substring(0, maxCount - (str.length))
		str

# Math.trunc
if !Math.trunc
	Math.trunc = (v) ->
		v = +v
		v - (v % 1) or (if !isFinite(v) or v == 0 then v else if v < 0 then -0 else 0)


# _.uniq isn't present in lodash.core
onlyUnique = (value, index, self) ->
	self.indexOf(value) == index
_.uniq = (array) ->
	array.filter onlyUnique

