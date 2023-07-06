namespace :npm do

  dest_dir = './tmp/dist'

  desc "Build the distribution artifacts"
  task build: :environment do
    # clear the directory
    if Dir.exist? dest_dir
      puts "Clearing dist directory #{dest_dir.bold}"
      FileUtils.rm_rf("#{dest_dir}/.", secure: true)
    else
      puts "Creating dist directory #{dest_dir.bold}"
      FileUtils.mkdir_p dest_dir
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
    FileUtils.cp pkg_in, "#{dest_dir}/package.json"

    # copy the contents of the directory
    from_dir = "app/frontend/"
    puts "Copying all files in #{from_dir.blue}"
    FileUtils.cp_r "#{from_dir}.", dest_dir
  end

  desc "Publish the terrier-engine npm package"
  task publish: :build do
    # publish the package
    cmd = "npm publish #{dest_dir}"
    puts "Publishing package with #{cmd.italic}"
    exec cmd
  end

end