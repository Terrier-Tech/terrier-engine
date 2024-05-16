# Validates a text array column containing e-mail addresses
class EmailListValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    return if value.empty?

    value.reject(&:blank?).each do |email|
      unless valid_email?(email)
        record.errors.add(attribute, "#{email} is not a valid email")
      end
    end
  end

  private

  def valid_email?(email)
    email =~ /\A[^@\s]+@[^@\s]+\.[^@\s]+\z/
  end
end