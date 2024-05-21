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

end