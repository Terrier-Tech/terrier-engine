namespace :npm do

  desc "Publish the terrier-engine npm package"
  task publish: :environment do
    dir = './tmp/dist'

    # clear the directory
    if Dir.exist? dir
      puts "Clearing dist directory #{dir.bold}"
      FileUtils.rm_rf("#{dir}/.", secure: true)
    else
      puts "Creating dist directory #{dir.bold}"
      FileUtils.mkdir_p dir
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
    FileUtils.cp pkg_in, "#{dir}/package.json"

    # copy the contents of the directory
    from_dir = "app/frontend/terrier/"
    puts "Copying all files in #{from_dir.blue}"
    FileUtils.cp_r "#{from_dir}.", dir

    # publish the package
    cmd = "npm publish #{dir}"
    puts "Publishing package with #{cmd.italic}"
    exec cmd
  end

end