# prints log messages with progress counts and time estimates
class ProgressLogger
  include ActionView::Helpers::DateHelper

  # @param context [Loggable|IO] the output target of the step messages
  def initialize(total, context = $stdout)
    @total = total
    @t_start = Time.now
    @context = context
    @last_step = 0
  end

  attr_reader :total, :last_step

  # prints a step message to the output context
  def step(n, message = '')
    n = 1 if n < 1
    @last_step = n
    percent = n / @total.to_f * 100
    t = Time.now
    elapsed = distance_of_time_in_words @t_start, t
    t_finish = @t_start + ((t - @t_start) / n * @total).seconds
    to_go = distance_of_time_in_words t, t_finish
    m = ["[#{n} of #{@total} (#{percent.round(2)}%)] #{elapsed} elapsed, #{to_go} to go", message.presence].compact.join(' - ')
    if @context.respond_to? :info
      @context.info m
    else
      @context.puts m
    end
    @context.try :flush
    m
  end

end