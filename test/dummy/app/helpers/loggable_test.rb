class LoggableTest
  include Loggable

  def test_bench
    bench 'test' do
      10000.times do
        i = Math.sqrt 1000
      end
    end
  end
end