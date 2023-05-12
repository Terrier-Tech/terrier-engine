namespace :npm do

  DIST_DIR = './tmp/dist'

  desc "Build the distribution artifacts"
  task build: :environment do
    # clear the directory
    if Dir.exist? DIST_DIR
      puts "Clearing dist directory #{DIST_DIR.bold}"
      FileUtils.rm_rf("#{DIST_DIR}/.", secure: true)
    else
      puts "Creating dist directory #{DIST_DIR.bold}"
      FileUtils.mkdir_p DIST_DIR
    end

    # overwrite the package version
    version = Terrier::VERSION
    puts "Overwriting package version to #{version.bold}"
    pkg_in = 'package.json'
    pkg_json = File.read pkg_in
    pkg_json.gsub! /"version":\s*"\d+\.\d+\.\d+"/, "\"version\": \"#{version}\""
    File.write pkg_in, pkg_json

    # copy package.json
    puts "Copying #{'package.json'.bold}"
    FileUtils.cp pkg_in, "#{DIST_DIR}/package.json"

    # copy the contents of the directory
    from_dir = "app/frontend/terrier/"
    puts "Copying all files in #{from_dir.blue}"
    FileUtils.cp_r "#{from_dir}.", DIST_DIR
  end

  desc "Publish the terrier-engine npm package"
  task publish: :build do
    # publish the package
    cmd = "npm publish #{DIST_DIR}"
    puts "Publishing package with #{cmd.italic}"
    exec cmd
  end

end