# Encrypts and decrypts strings using AES-256 encryption.
# Encrypted content is url-safe base64 encoded and is suitable for sending in an HTTP request in a URL parameter.
# Both the encrypter and decrypter must have a copy of the same encryption key.
class AesEncrypter
  KEY_LENGTH_BITS = 256

  # @param base64_key [String] the key used to encrypt/decrypt content.
  #   This key must be a base64 encoded string that decodes to 256 bits. Use AesEncrypter.gen_key to generate a valid key
  def initialize(base64_key)
    @key = Base64.strict_decode64(base64_key)
    key_size_bits = @key.bytesize * 8
    unless key_size_bits == KEY_LENGTH_BITS
      raise ArgumentError, "Given key is #{key_size_bits} bits, but it should be 256 bits"
    end
  end

  # Generate a valid key to be used with AesEncrypter
  def self.gen_key
    Base64.strict_encode64(self.make_cipher.random_key)
  end

  # Encrypts and encodes the given content
  # @param content [String] any string content to encode
  # @return [String] an encrypted, url-safe base64 encoded result
  def encrypt(content)
    timestamp = Time.now.iso8601

    payload = "#{timestamp}.#{content}"

    cipher = AesEncrypter.make_cipher.encrypt
    cipher.key = @key

    # The AES IV is a random value, similar to a salt. We generate a separate IV for each encode operation so that
    # encoding the same value multiple times produces different encoded results.
    iv = cipher.random_iv
    encrypted_payload = cipher.update(payload) + cipher.final
    base64_payload = Base64.urlsafe_encode64(encrypted_payload, padding: false)

    # The IV is encoded as base64 and included in the result so that it can be used during decrypt.
    # As long as an adversary doesn't know the key, the IV is safe to distribute.
    base64_iv = Base64.urlsafe_encode64(iv, padding: false)

    # The auth tag is some crypto mumbo-jumbo that the internet says is essential for making sure that the
    # payload can't be modified without our knowledge.
    base64_auth_tag = Base64.urlsafe_encode64(cipher.auth_tag, padding: false)

    "#{base64_iv}:#{base64_auth_tag}:#{base64_payload}"
  end

  # Decodes and decrypts the given encoded content
  # @param encoded_content [String] the encoded content, encrypted with AES-256 then base64 encoded.
  #   The content should be of the form <base64 iv>:<base64 auth tag>:<base64 encrypted payload>
  # @param timeout [Integer, ActiveSupport::Duration, nil] a timeout in integer number of seconds or a duration.
  #   If the original payload was encrypted more than this duration ago, raises an AesEncrypter::TimeoutError.
  #   If nil, no time validation is performed.
  def decrypt(encoded_content, timeout: nil)
    base64_iv, base64_auth_tag, base64_payload = encoded_content.split(':', 3)

    if base64_iv.blank? || base64_auth_tag.blank? || base64_payload.blank?
      raise ArgumentError, 'Encrypted content is malformed'
    end

    cipher = AesEncrypter.make_cipher.decrypt
    cipher.key = @key
    cipher.iv = Base64.urlsafe_decode64(base64_iv)
    cipher.auth_tag = Base64.urlsafe_decode64(base64_auth_tag)
    decrypted_payload = cipher.update(Base64.urlsafe_decode64(base64_payload)) + cipher.final

    timestamp, content = decrypted_payload.split('.', 2)
    unless timeout.nil?
      timeout = timeout.seconds if timeout.is_a?(Integer)
      expiration = Time.parse(timestamp) + timeout
      if expiration < Time.now
        raise TimeoutError, "The given payload was encoded at #{timestamp}, which is more than the timeout of #{timeout.inspect} ago"
      end
    end

    content
  end

  def self.make_cipher
    OpenSSL::Cipher.new('AES-256-GCM')
  end

  class TimeoutError < StandardError; end
end
