require 'terrier/scripts/script_config'


Terrier::ScriptConfig.category_icons = {
    none: 'sad-outline', # this should never actually be used
    admin: 'calculator',
    locations: 'location',
    miscellaneous: 'grid'
}

# dummy needs a migration in order for this to work
# Terrier::ScriptConfig.report_type_icons = {
#     none: 'sad-outline', # this should never actually be used
#     payments: 'calculator',
#     locations: 'location'
# }

Terrier::ScriptConfig.add_field(
  {
    key: :org_id,
    title: 'Organization',
    options: [['None', ''], ['Terrier', '12345'], ['Plunketts', '54321']],
    text_field: false
  }
)

Terrier::ScriptConfig.add_field(
  {
    key: :foo_id,
    title: 'Foobang',
    options: [['None', ''], ['Terrier', '12345'], ['Plunketts', '54321']],
    text_field: false
  }
)