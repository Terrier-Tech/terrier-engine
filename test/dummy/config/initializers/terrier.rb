require 'terrier/scripts/script_config'


Terrier::ScriptConfig.category_icons = {
    none: 'sad-outline', # this should never actually be used
    admin: 'calculator',
    locations: 'location',
    miscellaneous: 'grid'
}

Terrier::ScriptConfig.fields_help = "<p>This is some help that is shown for the fields.</p><ul><li>Item One</li><li>Item Two</li></ul><p>Another paragraph</p>"

# dummy needs a migration in order for this to work
# Terrier::ScriptConfig.report_type_icons = {
#     none: 'sad-outline', # this should never actually be used
#     payments: 'calculator',
#     locations: 'location'
# }
