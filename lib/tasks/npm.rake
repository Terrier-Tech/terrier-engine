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

    # copy package.json and overwrite the version
    version = Terrier::VERSION
    puts "Copying #{'package.json'.bold} and overwriting version to #{version.blue}"
    pkg_json = File.read 'package.json'
    pkg_json.gsub /"version": "\d+\.\d+\.\d+"/, "\"version\":\s*\"#{version}\""
    File.write "#{dir}/package.json", pkg_json

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