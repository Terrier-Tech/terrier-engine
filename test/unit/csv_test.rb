require 'test_helper'
require 'spreadsheet/workbook'

class CsvTest < ActiveSupport::TestCase

  test "should save multiple sheets" do
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
    workbook_path = CsvIo.save_xls(sheets, "/test/output/two_pages.xls")
    assert_equal(2, count_sheets(workbook_path), "Two Sheets")
  end

  test "should save one sheet" do
    workbook_path = CsvIo.save_xls([{col_1: 'h1', col_2: 'h2'}], "/test/two_pages.xls")
    assert_equal(1, count_sheets(workbook_path), 'One Sheet')
  end

  def count_sheets(path)
    book = Spreadsheet::Excel::Workbook.open open(path)
    book.sheet_count
  end

  test 'sorted columns' do
    data = 0.upto(10).map do |i|
      {foo: i.to_s, bar: rand(), baz: 'ignore'}
    end
    out_path = CsvIo.save data, '/test/output/sorted_columns.csv', columns: %i[bar foo]
  end

  test 'loading xlsx' do
    data = CsvIo.load_xlsx '/test/input/test.xlsx'
    assert_equal 2, data.size
    assert_equal 10, data['Sheet 1'].size
    assert_equal 1, data['Sheet 2'].size
  end
end