class LoggableTest
  include Loggable

  def test_bench
    bench 'test' do
      0.upto(10000).sum
    end
  end
end