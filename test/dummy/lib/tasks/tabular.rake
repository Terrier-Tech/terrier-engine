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

  desc 'Generate a large set of tabular data and write it to public/system/tabular/large.xlsx'
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


end