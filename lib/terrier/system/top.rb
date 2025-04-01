module Top

  def self.compute
    data = {}

    platform = RUBY_PLATFORM.index('darwin') ? :mac : :linux

    # CPU load
    out = `w | head -1`
    data[:load] = out.split(':').last.strip.split(/[\s,]+/).map(&:to_f)

    # memory and CPU count
    case platform
    when :mac
      data[:cpus] = Top.mac_cores
      data[:memory] = Top.mac_memory
    when :linux
      data[:cpus] = Top.linux_cores
      data[:memory] = Top.linux_memory
    else
      raise "Don't know how to compute memory for platform #{platform}"
    end
    data[:memory][:free] ||= data[:memory][:total] - data[:memory][:used]

    # disk
    df = `df -m`
    df.split("\n").map(&:strip).each do |line|
      if line.ends_with?('/') # this is the root partition
        data[:disk] = Top.parse_disk_line line
      elsif line.index(/\s\/mnt\//) || line.index(/\/System\/Volumes\/Data$/) # /System/Volumes/Data for development
        if defined?(CLYP) && line.index(CLYP) # prefer vols with clyp name
          data[:volume] = Top.parse_disk_line line
        else
          data[:volume] ||= Top.parse_disk_line line
        end
      end
    end

    data
  end

  def self.mac_cores
    `sysctl -n hw.ncpu`.to_i
  end

  def self.linux_cores
    `nproc`.to_i
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
    mem_line = `free -k`.split("\n").select { |line| line.index('Mem:') }.first
    vals = mem_line.scan(/\s\d+\s/).map(&:to_f)
    {
      total: vals[0] / MEGA,
      used: (vals[1] + vals[3]) / MEGA # used + shared
    }
  end

  # parses a line from `df -m` into a total/used/free hash
  def self.parse_disk_line(line)
    comps = line.scan(/\s\d+/).map(&:strip).map { |s| s.to_f / KILO }
    {
      total: comps[0],
      used: comps[1],
      free: comps[2]
    }
  end

end