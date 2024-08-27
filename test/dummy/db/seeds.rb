puts "Seeding database..."

## Config

change_user = 'db:seed'

# the contacts and orders take a long time to generate
# you can skip them if they already exist
skip_contacts = false
skip_orders = false

# by default, existing work orders will keep their times
# set this to true for them to be updated to current
update_times = true

# define how many of each thing should be created
totals = {
  users: 1000,
  locations: 10000,
  contacts: 5000,
  contract: 50,
  onetime: 5
}


## Helpers

def fake_address(record)
  record.address1 ||= Faker::Address.street_address
  record.address1 ||= Faker::Address.secondary_address
  record.city ||= Faker::Address.city
  record.state ||= Faker::Address.state
  record.zip ||= Faker::Address.zip_code
end


## Users

user_map = User.all.to_a.index_by &:extern_id
0.upto(totals[:users]) do |user_num|
  extern_id = "user-#{user_num}"
  user = user_map[extern_id] || User.new(extern_id: extern_id)
  if user.persisted?
    puts "Updating user #{extern_id.bold}:"
  else
    puts "Creating new user #{extern_id.bold}:"
    user.generate_password
    user_map[extern_id] = user
  end
  user.first_name ||= Faker::Name.first_name
  user.last_name ||= Faker::Name.last_name
  user.email ||= Faker::Internet.email(name: user.full_name)
  fake_address user
  user.role ||= User.possible_role_values.sample
  unless user.role == 'customer' or user.tags.present?
    user.tags = [Faker::Job.position, Faker::Job.seniority]
  end
  ap user
  user.save_if_needed! change_user
end
all_users = user_map.values
techs = all_users.select{|u| u.role == 'technician'}
puts "There are #{techs.count.to_s.bold} techs"


## Locations

loc_map = Location.all.to_a.index_by &:extern_id
0.upto(totals[:locations]) do |loc_num|
  extern_id = "location-#{loc_num}"
  loc = loc_map[extern_id] || Location.new(extern_id: extern_id)
  if loc.persisted?
    puts "Updating location #{extern_id.bold}:"
  else
    puts "Creating new location #{extern_id.bold}:"
    loc_map[extern_id] = loc
  end
  loc.number ||= loc_num
  loc.display_name ||= (loc_num % 2 == 0 ? Faker::Name.name : Faker::Company.name)
  fake_address loc
  loc.status ||= Location.possible_status_values.sample
  ap loc
  loc.save_if_needed! change_user
end
all_locs = loc_map.values


## Contacts

if skip_contacts
  puts "Skipped generating contacts, there are #{Contact.all.count.to_s.bold} of them"
else
  contact_map = Contact.all.includes(:user, :location).to_a.index_by &:extern_id
  0.upto(totals[:contacts]) do |contact_num|
    extern_id = "contacts-#{contact_num}"
    contact = contact_map[extern_id] || Contact.new(extern_id: extern_id)
    if contact.persisted?
      puts "Updating contact #{extern_id.bold}:"
    else
      puts "Creating new contact #{extern_id.bold}:"
    end
    user = contact.user || all_users.sample
    loc = contact.location || all_locs.sample
    contact.user_id = user.id
    contact.location_id = loc.id
    contact.contact_type = user.role == 'customer' ? 'customer' : 'employee'
    ap contact
    contact.save_if_needed! change_user
  end
  puts "There are #{Contact.all.count.to_s.bold} contacts"
end


## Targets

target_names = ["Ants", "Bed Bugs", "Birds", "Crawling Insects", "Fall Invaders", "Flying Insects", "Moles", "Mosquitoes", "Nuisance Animals", "Ornamental", "Roaches", "Rodents", "Spiders", "Stinging Insects", "Stored Product Pests", "Viruses and Bacteria", "Weeds", "Wood Destroyers"]
target_map = Target.all.to_a.index_by &:extern_id
target_names.each do |name|
  extern_id = "target-#{name}"
  target = target_map[extern_id] || Target.new(extern_id: extern_id)
  if target.persisted?
    puts "Updating existing target #{name.bold}"
  else
    puts "Creating new target #{name.bold}"
    target_map[extern_id] = target
  end
  target.name = name
  ap target
  target.save_if_needed! change_user
end
targets = target_map.values


## Work Orders

if skip_orders
  puts "Skipped generating work orders, there are #{WorkOrder.all.count.to_s.bold} of them"
else
  all_locs.each do |loc|
    puts "Seeding work orders for location #{loc.number}"
    total = totals[loc.status.to_sym]
    order_map = loc.work_orders.to_a.index_by &:extern_id
    0.upto(total) do |order_num|
      extern_id = "#{loc.number}-order-#{order_num}"
      order = order_map[extern_id] || WorkOrder.new(extern_id: extern_id)
      if order.persisted?
        puts "Updating order #{extern_id.bold}:"
      else
        puts "Creating new order #{extern_id.bold}:"
        order.location_id = loc.id
      end
      order.user_id ||= techs.sample.id
      order.price = rand(30000).round unless order.price && order.price > 0
      order.time = nil if update_times
      order.target_id ||= targets.sample.id
      order.notes ||= [Faker::Verb.past.titleize, Faker::Appliance.equipment].join(' ')
      unless order.time
        d_week = (order_num - total + 4)
        d = Date.today.beginning_of_week + d_week.weeks
        d += rand(7).days
        order.time = d.to_time + rand(16).hours
        if order.time > Time.now
          order.status = 'active'
        else
          order.status = 'complete'
        end
      end
      ap order
      order.save_if_needed! change_user
    end
  end
  puts "There are #{WorkOrder.all.count.to_s.bold} work orders"
end


## Invoices

all_locs.each do |loc|
  invoice_map = loc.invoices.to_a.index_by &:month
  puts "Generating invoices for location #{loc.number}"
  grouped_orders = loc.work_orders.where(status: 'complete').to_a.group_by &:month
  grouped_orders.each do |month, month_orders|
    next unless month
    puts "[#{loc.number}] There are #{month_orders.count} orders in #{month}"
    invoice = invoice_map[month]
    if invoice
      puts "[#{loc.number}] Using existing invoice for #{invoice.date}"
    else
      puts "[#{loc.number}] Creating new invoice for #{month}"
      invoice = Invoice.new location_id: loc.id, date: Date.parse("#{month}-01")
    end
    invoice.price = month_orders.map(&:price).sum
    invoice.status = invoice.date < (Date.today - 1.month) ? 'paid' : 'open'
    Invoice.transaction do
      invoice.save_if_needed! change_user
      month_orders.each do |order|
        order.invoice_id = invoice.id
        order.save_if_needed! change_user
      end
    end
  end
end
puts "There are #{Invoice.all.count.to_s.bold} invoices"

