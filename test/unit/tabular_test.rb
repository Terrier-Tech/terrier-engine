require 'test_helper'
require 'spreadsheet/workbook'

class TabularTest < ActiveSupport::TestCase

  test "save multiple sheets" do
    sheets = {
        sheet_one: [
            {col_1: 'r1c1', col_2: 'r1c2'},
            {col_1: 'r2c1', col_2: 'r2c2'}
        ],
        sheet_two: [
            {col_1: 'h1', col_2: 'h2'},
            {col_1: 'b1', col_2: 'c2'}
        ]
    }
    workbook_path = TabularIo.save sheets, "/test/output/two_pages.xls"
    assert_equal 2, count_sheets(workbook_path), "Two Sheets"
  end

  test "save one sheet" do
    workbook_path = TabularIo.save [{ col_1: 'h1', col_2: 'h2'}], "/test/output/one_page.xls"
    assert_equal 1, count_sheets(workbook_path), 'One Sheet'
  end

  def count_sheets(path)
    book = Spreadsheet::Excel::Workbook.open open(path)
    book.sheet_count
  end

  test 'sort columns' do
    data = 0.upto(10).map do |i|
      {foo: i.to_s, bar: rand, baz: 'ignore'}
    end
    rel_path = '/test/output/sorted_columns.csv'
    columns = %w[bar foo]
    TabularIo.save data, rel_path, columns: columns
    in_data = TabularIo.load rel_path
    assert_equal columns, in_data.first.keys
  end

  test 'save xlsx' do
    data_out = 0.upto(10).map do |i|
      { foo: i.to_s, bar: rand, baz: 'ignore' }
    end
    rel_path = '/test/output/save_load.xlsx'
    TabularIo.save data_out, rel_path
    all_data_in = TabularIo.load rel_path
    assert all_data_in.is_a?(Hash)
    data_in = all_data_in.values.first
    assert_equal data_out.count, data_in.count
    assert_equal data_out.first[:foo], data_in.first['foo'].to_s
  end

  test 'load xlsx' do
    data = TabularIo.load_xlsx '/test/input/test.xlsx'
    assert_equal 2, data.size
    assert_equal 10, data['Sheet 1'].size
    assert_equal 1, data['Sheet 2'].size
  end

  test 'split xlsx into csv' do
    rel_out_dir = '/test/output'
    sheets = TabularIo.split '/test/input/test.xlsx', out_dir: rel_out_dir
    sheets.each do |name, xlsx_data|
      rel_out_path = File.join rel_out_dir, "#{name}.csv"
      csv_data = TabularIo.load rel_out_path
      assert_equal xlsx_data.size, csv_data.size
    end
  end

  test 'support CSV header trailing space' do
    raw = <<CSV
import,ServiceName,Revenue Class,program,program_element,work_code,service,treatment_groups,schedule,Notes,
,EN-Design Fee,Enhancement,,,,,,,no contracts with this service.,
CSV
    data = TabularIo.parse_csv raw
    assert_equal data.count, 1
    assert_equal data.first['Revenue Class'], 'Enhancement'
  end

  test 'support CSV header empty inner cells' do
    raw = <<CSV
one,two,,four
ONE,TWO,THREE,FOUR
CSV
    data = TabularIo.parse_csv raw
    assert_equal data.count, 1
    row = data.first
    assert_equal row['__3__'], 'THREE'
    assert_equal row['four'], 'FOUR'
  end

  test 'allow loading of just the header' do
    ['csv', 'xls', 'xlsx'].each do |ext|
      sheet_headers = TabularIo.load_headers "/test/input/correct_#{ext}.#{ext}"
      sheet_headers.each do |sheet_name, headers|
        assert_equal headers, ["email", "first_name", "last_name", "phone"]
      end
    end
  end

  test 'empty sheet returns empty array for load_headers' do
    ['csv', 'xls', 'xlsx'].each do |ext|
      sheet_headers = TabularIo.load_headers "/test/input/empty_#{ext}.#{ext}"
      sheet_headers.each do |sheet_name, headers|
        assert_equal headers, []
      end
    end
  end

  test 'blank rows (still commas in case of csv) returns empty array for load_headers' do
    ['csv', 'xls', 'xlsx'].each do |ext|
      sheet_headers = TabularIo.load_headers "/test/input/blank_rows_#{ext}.#{ext}"
      sheet_headers.each do |sheet_name, headers|
        assert_equal headers, []
      end
    end
  end

  test 'valid_file_type? for files formatted correctly according to their extension' do
    ['csv', 'xls', 'xlsx'].each do |ext|
      assert TabularIo.valid_file_type? "/test/input/correct_#{ext}.#{ext}"
    end
  end

  test 'valid_file_type? for files formatted incorrectly according to their extension' do
    ['csv', 'xls', 'xlsx'].permutation(2).each do |actual_ext, fake_ext|
      assert (not TabularIo.valid_file_type? "/test/input/incorrect_format_#{actual_ext}_as_#{fake_ext}.#{fake_ext}")
    end
  end

  test 'file_empty? for files formatted correctly' do
    ['csv', 'xls', 'xlsx'].each do |ext|
      assert (not TabularIo.file_empty? "/test/input/correct_#{ext}.#{ext}")
    end
  end

  test 'file_empty? for files with blank rows' do
    ['csv', 'xls', 'xlsx'].each do |ext|
      assert TabularIo.file_empty? "/test/input/blank_rows_#{ext}.#{ext}"
    end
  end

  test 'file_empty? for empty files' do
    ['csv', 'xls', 'xlsx'].each do |ext|
      assert TabularIo.file_empty? "/test/input/empty_#{ext}.#{ext}"
    end
  end

  test 'file_empty? for files missing headers (should be fine)' do
    ['csv', 'xls', 'xlsx'].each do |ext|
      assert (not TabularIo.file_empty? "/test/input/missing_header_#{ext}.#{ext}")
    end
  end

  test 'optional n_blank_allowed parameter works at default of 0' do
    ['csv', 'xls', 'xlsx'].each do |ext|
      data = TabularIo.load "/test/input/missing_row_#{ ext }.#{ ext }", output: :standardized
      sheet_name, sheet = data.first
      expected = 1  # Expected number of rows before encountering blank rows
      actual = sheet.size
      assert_equal expected, actual,  "Test failed for #{ ext.upcase } file. Expected #{ expected } row(s), but found #{ actual } row(s)."
    end
  end

  test 'optional throw_error_on_blank_row parameter throws error when there is a blank row' do
    ['csv', 'xls', 'xlsx'].each do |ext|
      assert_raises(TabularIo::BlankRowError) do
        TabularIo.load "/test/input/missing_row_#{ ext }.#{ ext }", output: :standardized, throw_error_on_blank_row: true
      end
    end
  end
end