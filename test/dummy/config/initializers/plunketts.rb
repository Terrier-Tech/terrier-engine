require 'plunketts/scripts/script_config'


Plunketts::ScriptConfig.category_icons = {
    none: 'sad-outline', # this should never actually be used
    admin: 'calculator',
    locations: 'location',
    miscellaneous: 'grid'
}

# dummy needs a migration in order for this to work
# Plunketts::ScriptConfig.report_type_icons = {
#     none: 'sad-outline', # this should never actually be used
#     payments: 'calculator',
#     locations: 'location'
# }