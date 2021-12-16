# prints log messages with progress counts and time estimates
class ProgressLogger
  include ActionView::Helpers::DateHelper

  def initialize(total, context=$stdout)
    @total = total
    @t_start = Time.now
    @context = context
  end

  def step(n, message='')
    n = 1 if n < 1
    percent = n/@total.to_f * 100
    t = Time.now
    elapsed = distance_of_time_in_words @t_start, t
    t_finish = @t_start + ((t-@t_start)/n*@total).seconds
    to_go = distance_of_time_in_words t, t_finish
    m = "[#{n} of #{@total} (#{percent.round(2)}%) - #{elapsed} elapsed, #{to_go} to go] #{message}"
    @context.puts m
    Rails.logger.debug m
    @context.try :flush
    m
  end

end