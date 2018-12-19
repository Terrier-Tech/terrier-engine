# Plunketts::Engine

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
 * callback: a callback function that receives the modal jQuery instance once it's shown
 * actions: an array of actions to go at the bottom
 
Each action value can have the following attributes:
 * title: the title of the button
 * icon: a un-prefixed icon class name
 * class: a space-separated list of class names
 * attrs: a hash of tinyTemplate attributes
 * end: `true` to put it on the left



## Installation
Add this line to your application's Gemfile:

```ruby
gem 'plunketts-engine'
```

And then execute:
```bash
$ bundle
```


## License
The gem is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).
