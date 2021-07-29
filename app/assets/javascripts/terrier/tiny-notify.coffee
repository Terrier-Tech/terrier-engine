window.tinyNotify = {}

_messageTemplate = tinyTemplate (message) ->
  div ".tiny-notify .#{message.type}", ->
    span ".#{message.icon}, .message", "#{message.text}"

_actionTemplate = tinyTemplate (action) ->
  iconklass = ''
  if action.icon
    iconKlass = '.with-icon'
  a "#{iconKlass}", {href: "#{action.href}"}, ->
    if action.icon
      icon ".#{action.icon}"
    span '', action.title

window.tinyNotify.show = (type, message, opts={}) ->
  _.defaults opts, {
    autoclose: true
    duration: 3000
    side: 'ne'
    icon: ''
    action: {}
  }
  container = $(".#{opts.side}#tiny-notifications")
  message = $(_messageTemplate({type: type, text: message, icon: opts.icon})).appendTo container
  message.addClass 'show'

  if opts.action.hasOwnProperty('title')
    $(_actionTemplate(opts.action)).appendTo message

  if opts.autoclose == true
    setTimeout(
      ->
        message.removeClass('show')
        setTimeout(
          -> message.remove()
          500
        )
      opts.duration
    )

  if opts.action.hasOwnProperty('callback')
    callback = opts.action.callback
    callback()

window.tinyNotify.alert = (message, opts) -> window.tinyNotify.show 'alert', message, opts
window.tinyNotify.notice = (message, opts) -> window.tinyNotify.show 'notice', message, opts
$(document).on 'click', '#tiny-notifications .tiny-notify', ->
	$(this).remove()