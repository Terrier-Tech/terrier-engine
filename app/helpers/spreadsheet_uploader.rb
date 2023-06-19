class SpreadsheetUploader < Shrine
  plugin :determine_mime_type, analyzer: :marcel

  Attacher.validate do
    validate_size 1..10 * 1024 * 1024 # MB
    validate_mime_type %w[application/vnd.android.package-archive application/octet-stream application/zip]
  end
end