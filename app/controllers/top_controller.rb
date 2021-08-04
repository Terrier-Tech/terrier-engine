module Top

  def self.compute
    data = {}

    platform = RUBY_PLATFORM.index('darwin') ? :mac : :linux

    # CPU count
    data[:cpus] = `nproc`.to_i

    # CPU load
    out = `w | head -1`
    data[:load] = out.split(':').last.strip.split(/[\s,]+/).map(&:to_f)

    # memory
    data[:memory] = case platform
                    when :mac
                      Top.mac_memory
                    when :linux
                      Top.linux_memory
                    else
                      raise "Don't know how to compute memory for platform #{platform}"
                    end
    data[:memory][:free] ||= data[:memory][:total] - data[:memory][:used]

    # disk
    df = `df -m`
    root_line = df.split("\n").select{|s| s.ends_with?('/')}.first
    root_comps = root_line.scan(/\s\d+\s/).map(&:strip).map{|s| s.to_f/KILO}
    data[:disk] = {
      total: root_comps[0],
      used: root_comps[1],
      free: root_comps[2]
    }

    data
  end

  def self.mac_memory
    total = `sysctl hw.memsize`.split(':').last.to_f / GIGA
    # this doesn't actually capture all of the used memory but whatever
    rss = `ps -A -o rss | awk '{ mem += $1} END {print mem}'`.to_f / MEGA
    {
      total: total,
      used: rss
    }
  end

  def self.linux_memory
    mem_line = `free -k`.split("\n").select{|line| line.index('Mem:')}.first
    vals = mem_line.scan(/\s\d+\s/).map(&:to_f)
    {
      total: vals[0] / MEGA,
      used: (vals[1] + vals[3]) / MEGA # used + shared
    }
  end

end

class TopController < ApplicationController

  def index
    begin
      @top = Top.compute
      render_success '', @top
    rescue => ex
      render_exception ex
    end
  end

end