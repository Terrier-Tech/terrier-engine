namespace :tabular do

  def bench(name)
    t = Time.now
    res = yield
    dt = Time.now - t
    puts "Executed '#{name}' in #{dt.to_ms}ms"
    res
  end

  N = 200000

  LARGE_XLSX_PATH = 'tabular/large.xlsx'
  LARGE_CSV_PATH = 'tabular/large.csv'

  desc "Generate a large set of tabular data and write it in various formats to public/system/"
  task generate_large: :environment do
    data = {}

    bench "Generate #{N} Rows" do
      data[:sheet1] = 0.upto(N).map do |n|
        {
          id: n,
          foo: rand,
          bar: "Row #{n}",
          baz: rand > 0.5 ? 'high' : 'low',
          other_id: SecureRandom.uuid,
          date: Date.today-n.days
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

    bench "Save #{N} Rows in #{data.count} sheets to xlsx" do
      TabularIo.save data, LARGE_XLSX_PATH
    end

    bench "Save #{N} Rows to xlsx" do
      TabularIo.save data[:sheet1], LARGE_XLSX_PATH
    end

    bench "Save #{N} Rows to csv" do
      TabularIo.save data[:sheet1], LARGE_CSV_PATH
    end
  end

  desc "Splits the large file from public/system/#{LARGE_XLSX_PATH} into separate csv files"
  task split_large: :environment do
    bench 'Split Data' do
      TabularIo.split LARGE_XLSX_PATH
    end
  end

  desc "Loads the large CSV files to see if it's faster than reading them from the one xlsx"
  task load_large: :environment do
    %w[sheet1 sheet2].each do |name|
      rel_path = File.join File.dirname(LARGE_XLSX_PATH), "#{name}.csv"
      bench "Load #{rel_path}" do
        TabularIo.load rel_path
      end
    end
  end


end