require 'dotenv/load'
require 'puma/daemon'
require 'sys/proctable'


# compute the socket and pid paths
app_dir = Dir.pwd
tmp_dir = "#{app_dir}/tmp"
sockets_dir = File.join tmp_dir, 'sockets'
unless File.exists? sockets_dir
  FileUtils.mkdir sockets_dir
end
socket_path = "unix://#{sockets_dir}/puma.sock"
pids_dir = File.join tmp_dir, 'pids'
unless File.exists? pids_dir
  FileUtils.mkdir pids_dir
end
pid_path = "#{pids_dir}/puma.pid"

def stop_server(pid_path)
  was_killed = false
  if File.exists? pid_path
    pid = File.read pid_path
    pid = pid&.to_i || 0
    if pid > 0
      proc = Sys::ProcTable.ps(pid: pid)
      if proc
        puts "Killing existing process with pid #{pid}"
        Process.kill("HUP", pid)
        was_killed = true
      else
        puts "No process #{pid} found, nothing to kill"
      end
    end
    File.delete pid_path
  end
  was_killed
end

command = ARGV.first || 'restart'
case command
when 'restart'
  if stop_server pid_path
    puts "Restarting server..."
    sleep 0.5 # without this, the port is still bound when the application tries to start again
  else
    puts "Starting server..."
  end
when 'stop'
  puts 'Stopping server...'
  stop_server pid_path
  exit
else
  raise "Unknown command '#{command}'"
end

# get the port from the environment
port ENV.fetch("PORT") { 3000 }

# Puma can serve each request in a thread from an internal thread pool.
# The `threads` method setting takes two numbers: a minimum and maximum.
# Any libraries that use thread pools should be configured to match
# the maximum value specified for Puma. Default is set to 5 threads for minimum
# and maximum; this matches the default thread size of Active Record.
threads_count = ENV.fetch("RAILS_MAX_THREADS") { 5 }
threads threads_count, threads_count

# Specifies the number of `workers` to boot in clustered mode.
# Workers are forked webserver processes. If using threads and workers together
# the concurrency of the layout would be max `threads` * `workers`.
# Workers do not work on JRuby or Windows (both of which do not support
# processes).
workers ENV.fetch("WEB_CONCURRENCY") { 2 }

# bind to the UNIX socket and set the pid path
bind socket_path
pidfile pid_path

# Allow puma to be restarted by `rails restart` command.
plugin :tmp_restart

# Use the `preload_app!` method when specifying a `workers` number.
# This directive tells Puma to first boot the layout and load code
# before forking the layout. This takes advantage of Copy On Write
# process behavior so workers use less memory.
# preload_app!

daemonize