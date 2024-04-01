# Terrier::Engine

This Rails Engine contains common code used by all Rails applications at Terrier Technologies.

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

You can call `tinyModal.pop()` to pop the current modal off the stack
or `tinyModal.close()` to close all modals.

When popped, if an input with `name=modal-src` is present on the next top modal, 
the contents of that modal will be reloaded with the URL specified in the input. 
This behavior can also be called explicitly with `tinyModal.reload()`.

If a `.modal-reload` element exists within the modal when it's closed, the page will be reloaded.


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

```zsh
bundle
npm i
```

## Development

This engine comes with a test project in the `dummy` directory. 
To set up the dummy application:

```zsh
cd dummy
bundle
rails db:create
rails db:migrate
```

Optionally link to puma-dev:

```zsh
puma-dev link -n terrier-engine .
```

## Publishing

Terrier engine consists of two components that must be published separately:
the gem (contains .rb, .rake, .coffee, and .scss files)
and the npm package (contains .ts files and hub .svg icons).

In general, updates to the version number should happen on master, rather than in a specific PR.
If there are multiple PRs that update the version number simultaneously, they could cause conflicts.
This can be avoided by merging PRs without changes to the version number,
then updating the version number immediately prior to publishing the new version.

Even if you are only merging a single PR and publishing it immediately, for consistency we should
always follow the same publishing process.

### The Gem

Publishing a new version of the gem is very simple:

1. Update the version number in `lib/terrier/version.rb`.
2. Run `bundle install`.
3. Push changes.

Step 2 updates the `Gemfile.lock` with the new version number;
make sure to include it in the pushed changes.

Since the gem is distributed via Github, this is all that is necessary.

### The NPM Package

Whenever changes are made to `app/frontend/terrier`,
additional publish steps are required:

1. Update the version number in `lib/terrier/version.rb`.
2. Run `rails npm:build`.
3. Run `npm i`.
4. Run `bundle install`.
5. Push changes.
6. Run `rails npm:publish`

Steps 2-4 update the `Gemfile.lock`, `package.json`,
and `package-lock.json` with the new version number;
make sure to include it in the pushed changes.

Step 6 requires you to have an npmjs.org account
that has been added to the `terrier-engine` package.

## Testing Changes Locally

You can force applications that use Terrier engine to use your local version of the engine rather than the remotely published version.
The process is different depending on whether you need to use the local version of the npm package (anything in the `./app/frontend/` directory) or the gem (everything else).

### The Gem

1. In your client application repo, run `bundle config set --local local.terrier-engine </path/to/terrier-engine>`.
   This adds a `.bundle/config` file in your repo that redirects the terrier engine gem to your local path.
2. Run `bundle`.
3. Restart the client application.

Changes to these files should be automatically reflected in the client application upon refreshing.

### The NPM Package

1. In the terrier-engine repo, run `rails npm:build`.
   This assembles the required files for the terrier-engine npm package in the `./tmp/dist/` directory.
2. In your client application repo, run `npm install </path/to/terrier-engine>/tmp/dist/`.
3. Restart the client application (including vite if necessary).

In order for changes to these files to be reflected in the client application,
you must run `rails npm:build` again from the terrier engine repo, then refresh the client application.

### Reverting

To revert these changes and return to using the remote versions of the gem and npm package,
follow these steps:

1. Delete `./.bundle/config`
2. Run `bundle`
3. Revert changes to `./package.json`
4. Run `npm i`

Make sure to revert prior to merging or deploying.


## Terrier Platform

While this project started as a collection of utilities to share between projects,
it's evolved into a platform of shared tooling and styles to build applications.

### Terrier Frontend

TODO: document usage of frontend/terrier classes 

By convention when overriding the `init()` method on any `Part`, you should call `await super.init()` to preserve any functionality contained in the super-class's init method. This should be done in all cases, even if the super class does not define an init method, because if functionality is added to the superclass in the future the subclass should not need to change to support that functionality. The only exception should be when when you explicitly don't want the super class functionality in your subclass.

### Terrier Styles

The `.tt-*` styles are meant to be reusable across projects.
To include them in a particular host stylesheet, just add:

```scss
*= require terrier
```

In order to prevent conflicts with the host application and allow for as much flexibility as possible, these are *hard* rules for their development:

1. *No* styles should have any effect on elements not contained in a `.tt-*` class.
2. This includes basic typography styles, which only apply to element inside a `.tt-typography`.
3. *All configurability* should be done through CSS variables - not SCSS variables - so they can be changed without recompiling.
4. All CSS variables should contain the `tt-` prefix.


## License

The gem is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).
