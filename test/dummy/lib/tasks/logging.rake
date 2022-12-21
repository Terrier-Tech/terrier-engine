namespace :logging do

  desc "Demo the ProgressLogger output"
  task :demo_progress_logger do
    n = 100

    # make a custom loggable for the output
    loggable_class =
      class MyLoggable
        include Loggable
      end

    logger = ProgressLogger.new n, loggable_class.new
    0.upto(n) do |i|
      logger.step i, "Stepping..."
      sleep 1
    end
  end

end