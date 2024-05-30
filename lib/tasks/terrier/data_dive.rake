namespace :data_dive do

  desc "Runs a particular data dive"
  task :run, [:id] => [:environment] do |t, args|
    id = args[:id].presence || raise("Must pass a dive id")
    dive = DdDive.find id
    puts "Running dive #{dive.name.bold}"
    run = dive.run!({}, 'data_dive:run')
    ap run
    puts "https://terrier-engine.test#{run.output_file.url}"
  end

  desc "Pretends to send a particular dive"
  task :mock_deliver, [:id] => [:environment] do |t, args|
    id = args[:id].presence || raise("Must pass a dive id")
    dive = DdDive.find id
    puts "'Delivering' dive #{dive.name.bold}"
    change_user = 'data_dive:run'
    run = dive.run!({}, change_user)
    run.delivery_recipients = dive.delivery_recipients.presence || ['test@example.com']
    run.delivery_data = {mock: true}
    run.save_by! change_user
    ap run
    puts "'Delivered' dive to #{run.delivery_recipients_s.blue}"
    puts "https://terrier-engine.test#{run.output_file.url}"
  end


end