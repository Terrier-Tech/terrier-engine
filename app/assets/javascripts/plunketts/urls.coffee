window.urls = {}

window.urls.getBase = () ->
	window.location.protocol + '//' + window.location.host + window.location.pathname

# returns a hash of url parameters from the current location
window.urls.getParams = () ->
	vars = {}
	hashes = window.location.search.substring(1).split('&')
	for hash in hashes
		kv = hash.split('=')
		vars[kv[0]] = decodeURIComponent(kv[1])
	vars

# computes the url used in setUrlParams()
window.urls.forParams = (newParams, newHash=null) ->
	newUrl = urls.getBase() + '?'
	for key,val of newParams
		if key and val
			if newUrl[newUrl.length-1] != '?'
				newUrl += '&'
			newUrl += key + '=' + val
	if newHash?
		newUrl + newHash
	else
		newUrl + window.location.hash

# sets the windows location by modifying the current url with the new params
window.urls.setParams = (newParams, newHash=null) ->
	url = urls.forParams newParams, newHash
	if Turbolinks? and !$('body').data('no-turbolink')?
		Turbolinks.visit(url)
	else
		window.location.href = url

# changes one url param and loads the new page
window.urls.changParam = (param, value) ->
	params = urls.getParams()
	params[param] = value
	urls.setParams params