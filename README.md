# Terrier::Engine

This Rails Engine contains common code used by all Rails applications at Plunkett's Pest Control.

## Usage

A demo Rails application is available in test/dummy. Please add test pages as needed.


### Tiny Modal

```coffeescript
# show a modal from a URL:
tinyModal.show url, options

# show a modal with a content string:
tinyModal.showDirect content, options
```

`options` can have the following attributes:
 * title: the title of the modal
 * icon: an un-prefixed icon name for the title
 * tiny: `true` to make it tiny
 * layout: `false` to skip the modal layout
 * callback: a callback function that receives the modal jQuery instance once it's shown
 * actions: an array of actions to go at the bottom
 
Each action value can have the following attributes:
 * title: the title of the button
 * icon: a un-prefixed icon class name
 * class: a space-separated list of class names
 * attrs: a hash of tinyTemplate attributes
 * end: `true` to put it on the left


### Tiny Logger

Calling `tinyLogger.include` add debug/info/warn/error logging functions to the passed scope, such as a class.
For example:

```coffeescript
class TestClass
    constructor: ->
        tinyLogger.init this
        
    test: ->
        @info "this is info"
        @warn "this is a warning"
        @error "oh no, an error!"
```

This will print logging messages like:

```
[TestClass INFO 10:20:04.697 AM] this is info
[TestClass WARN 10:20:04.697 AM] this is a warning
[TestClass ERROR 10:20:04.697 AM] oh no, an error!
```

TinyLogger will automatically compute the log prefix by the class name of the object passed in, if it has a class. 
Otherwise you can specify a custom prefix:

```coffeescript
tinyLogger.init this, prefix: 'MyPrefix'
```

Optionally, you can pass an output element (selector string, DOM element, or jQuery object) where tinyLogger will append log divs:

```coffeescript
tinyLogger.init this, output: '#log-output'
@info "hello world"
```

will append a div to #log-output that looks something like:

```html
<div class="log info">
    <span class="prefix">[TestClass]</span>
    <span class="level">INFO</span>
    <span class="timestamp">10:20:04.694 AM</span>
    <span class="message">hello world</span>
</div>
```


## Installation
Add this line to your application's Gemfile:

```ruby
gem 'terrier-engine'
```

And then execute:
```bash
$ bundle
```


## License
The gem is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).
