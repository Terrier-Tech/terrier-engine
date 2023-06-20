class SpreadsheetUploader < Shrine
  plugin :determine_mime_type, analyzer: :marcel

  Attacher.validate do
    validate_size 1..10 * 1024 * 1024 # MB
    validate_mime_type %w[text/csv application/vnd.ms-excel application/vnd.openxmlformats-officedocument.spreadsheetml.sheet]
  end
end