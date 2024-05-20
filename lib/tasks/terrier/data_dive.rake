namespace :data_dive do

  desc "Runs a particular data dive"
  task :run, [:id] => [:environment] do |t, args|
    id = args[:id].presence || raise("Must pass a dive id")
    dive = DdDive.find id
    engine = DataDive::DiveEngine.new dive, 'data_dive:run'
    run = DdDiveRun.new dd_dive_id: dive.id
    engine.run! run, {}
  end

end