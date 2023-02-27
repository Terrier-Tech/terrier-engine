require 'terrier/scripts/script_executor'
require 'terrier/scripts/script_searcher'

namespace :scripts do

  def run_time(time)
    scripts = Script.where(schedule_time: time, _state: 0).where("array_length(schedule_rule_summaries,1)>0")
    
    puts "#{scripts.count} scripts for #{time}"

    day = Time.now
    hour = day.strftime('%H')
    scripts.each do |script|
      if (script.schedule_contains_day? day) || ((script.schedule_contains_day? day) && (script.schedule_contains_hour? hour))
        puts "Running script #{script.id}: #{script.title}"
        executor = ScriptExecutor.new script, ModelCache.new
        executor.me = "#{time.titleize} Runner"
        run = executor.init_run
        executor.run run, nil
        puts "Completed with status '#{run.status}' in #{run.duration} seconds"
        if run.errors && run.errors.full_messages.length > 0
          puts "error saving script run: #{run.errors.full_messages.join(', ')}"
          puts run.inspect
        else
          run.save_by_user! executor.me
        end
      end
    end
  end

  desc 'Runs all morning scheduled scripts for today'
  task run_morning: :environment do
    run_time 'morning'
  end

  desc 'Runs all evening scheduled scripts for today'
  task run_evening: :environment do
    run_time 'evening'
  end

  desc 'Runs all hourly scheduled scripts for today'
  task run_hourly: :environment do
    run_time 'hourly'
  end

end