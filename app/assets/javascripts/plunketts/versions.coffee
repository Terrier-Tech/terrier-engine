window.versions = {}

# throws if parseInt(s) returns a NaN
parseIntThrowNaN = (s) ->
	i = parseInt s
	if isNaN(i)
		throw "#{s} is not a number"
	i


# parses a version string of the form "major.minor.patch" into an object with those keys and integer values
# throws if there's a parsing error
versions.parse = (s) ->
	comps = s.split '.'
	unless comps.length == 3
		throw "s must have three parts separated by periods!"
	{
		major: parseIntThrowNaN(comps[0])
		minor: parseIntThrowNaN(comps[1])
		patch: parseIntThrowNaN(comps[2])
	}


# returns either 'greater', 'equal', or 'less' as a comparison between version strings v1 and v1.
# If 'greater', v1 is greater than v2, etc.
versions.compare = (v1, v2) ->
	vs = [versions.parse(v1), versions.parse(v2)]
	for step in ['major', 'minor', 'patch']
		if vs[0][step] > vs[1][step]
			return 'greater'
		if vs[0][step] < vs[1][step]
			return 'less'
	'equal'
