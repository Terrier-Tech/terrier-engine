namespace :tabular do

  def bench(name)
    t = Time.now
    res = yield
    dt = Time.now - t
    puts "Executed '#{name}' in #{dt.to_ms}ms"
    res
  end

  N = 100000

  LARGE_PATH = 'tabular/large.xlsx'

  desc "Generate a large set of tabular data and write it to public/system/#{LARGE_PATH}"
  task generate_large: :environment do
    data = {}

    bench 'Generate Data' do
      data[:sheet1] = 0.upto(N).map do |n|
        {
          id: n,
          foo: rand,
          bar: "Row #{n}",
          baz: rand > 0.5 ? 'high' : 'low'
        }
      end

      data[:sheet2] = 0.upto(N).map do |n|
        {
          id: n+10000,
          rand: SecureRandom.uuid,
          one_id: n,
          repeating: SecureRandom.alphanumeric(4)*8
        }
      end
    end

    bench 'Save Data' do
      TabularIo.save data, LARGE_PATH
    end
  end

  desc "Splits the large file from public/system/#{LARGE_PATH} into separate csv files"
  task split_large: :environment do
    bench 'Split Data' do
      TabularIo.split LARGE_PATH
    end
  end

  desc "Loads the large CSV files to see if it's faster than reading them from the one xlsx"
  task load_large: :environment do
    %w[sheet1 sheet2].each do |name|
      rel_path = File.join File.dirname(LARGE_PATH), "#{name}.csv"
      bench "Load #{rel_path}" do
        TabularIo.load rel_path
      end
    end
  end


end