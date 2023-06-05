# Glyps Sketch Plugin

The SVG files in public/glyp are the source of truth for the icons.
You can edit them individually, or use the Glyps Sketch plugin to import them into a single Sketch file.

## Installation

You should be able to install the plugin by double clicking on `lib/sketch-glyps/sketch-glyps.sketchplugin`

## Usage

### Import

You can start with an empty Sketch file and run the Plugins->Glyps->Import command to
import all glyp SVGs from public/glyp into the document.

The location of the public/glyp directory is inferred relative to `~/.puma-dev/clypboard-server`,
so this function is dependent on having puma-dev correctly configured. 

### Arrange


## Building

Navigate to the `lib/sketch-glyps` directory and run:

```
npm install
```

To build the plugin (this needs to be done after every source change, the --watch feature does not work):

```
npm run build
```

To tail the Sketch plugin log:

```
skpm log -f
```
