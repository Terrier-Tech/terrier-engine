# This is a manifest file that'll be compiled into layout.js, which will include all the files
# listed below.
#
# Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
# or any plugin's vendor/assets/javascripts directory can be referenced here using a relative path.
#
# It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
# compiled file. JavaScript code in this file should be added after the last require_* statement.
#
# Read Sprockets README (https:#github.com/rails/sprockets#sprockets-directives) for details
# about supported directives.
#
#= require jquery3
#= require rails-ujs
#= require turbolinks
#= require lodash
#= require plunketts/forms.coffee
#= require plunketts/strings.coffee
#= require plunketts/polyfills.coffee
#= require plunketts/tinytemplate.coffee
#= require plunketts/tiny-modal.coffee
#= require plunketts/tiny-sql.coffee
#= require plunketts/scripts.coffee
#= require plunketts/urls.coffee
#= require_tree .



$.fn.showLoadingOverlay = ->
	if this.find('.loading-overlay').length
		return
	this.append "<div class='loading-overlay'></div>"


$.fn.removeLoadingOverlay = ->
	this.find('.loading-overlay').remove()