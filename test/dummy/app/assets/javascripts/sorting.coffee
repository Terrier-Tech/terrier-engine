window.sorting = {}

################################################################################
# Filter And Sort
################################################################################

# Sorts and filters the children of ui based on matching query to a data attribute.
# Filtering is based on whether the key contains the query (case insensitive).
# Sorting is done based on simple relevance (i.e. matches to the beginning of words will be higher)
#
# @param options [Object]
# @option options [String] :attribute HTML data attribute to sort by ("key" by default)
window.sorting.filterAndSort = (ui, query, options= {}) ->
	items = ui.children()
	attr = options.attribute || "key"

	# construct a function that will return an integer closer to zero for closer matches
	# matching the start of a word is ranked better than simply matching
	relMax = 1000
	regex = new RegExp "\\b#{query}", "i"
	relFun = (key) ->
		rawIndex = key.toLowerCase().indexOf query.toLowerCase()
		return relMax unless rawIndex > -1
		return regex.lastIndex if regex.test key # return the index of the first matched word
		return rawIndex * key.length # didn't match a word boundary, push the index out

	items.sort (a, b) ->
		aKey = a.dataset[attr]
		aRel = relFun aKey
		bKey = b.dataset[attr]
		bRel = relFun bKey
		$(a).toggle aRel < relMax
		$(b).toggle bRel < relMax
		return aRel - bRel

	items.detach().appendTo ui

## Demo

_nameList = [
	"Alice", "Brian", "Chloe", "David", "Emily", "Frank", "Grace", "Henry", "Isla", "Jack",
	"Emma", "Liam", "Olivia", "Noah", "Ava", "William", "Sophia", "James", "Isabella",
	"Oliver", "Aarav", "Mei", "Carlos", "Fatima", "Ivan", "Oluwatobi", "Sakura", "Youssef",
	"Zara", "Harry", "Hermione", "Luke", "Leia", "Frodo", "Arya", "Sherlock", "Katniss",
	"Spock", "T'Challa"
]

_filterAndSortDemoTemplate = tinyTemplate ->
	div ".tt-flex.gap", ->
		div "", ->
			input ".filter-by-key", type: "text", placeholder: "10.."
			div ".sortable-by-key.tt-flex.column.align-center.text-center", ->
				for num in [1.._nameList.length]
					div "", data: {key: num.toString()}, num.toString()
		div "", ->
			input ".filter-by-name", type: "text", placeholder: "Spock.."
			div ".sortable-by-name.tt-flex.column.align-center.text-center", ->
				for name in _nameList
					div "", data: {name: name}, name

class FilterAndSortDemo
	constructor: (@ui) ->
		@ui.html _filterAndSortDemoTemplate()

		@ui.find(".filter-by-key").on "input", (evt) =>
			val = $(evt.currentTarget).val()
			container = @ui.find(".sortable-by-key")
			sorting.filterAndSort container, val

		@ui.find(".filter-by-name").on "input", (evt) =>
			val = $(evt.currentTarget).val()
			container = @ui.find(".sortable-by-name")
			sorting.filterAndSort container, val, {attribute: "name"}

window.sorting.initFilterAndSortDemo = (ui) -> new FilterAndSortDemo $(ui)

