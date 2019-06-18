export default {
	process (array, by) {
		let options
		if (by.indexOf(':')) {
			options = by.split(':')
			by = options.shift()
		}

		switch (by) {
		case 'average':
			return this.average(array)
		case 'sum':
			return this.sum(array)
		case 'lowest':
			return Math.min(...array)
		case 'highest':
			return Math.max(...array)
		case 'any':
			return (array.indexOf(options[0]) > -1 || array.indexOf(parseInt(options[0])) > -1) ? 1 : 0
		case 'none':
			return (array.indexOf(options[0]) === -1 && array.indexOf(parseInt(options[0])) === -1) ? 1 : 0
		case 'first':
		default:
			return array[0]
		}
	},
	average (array) {
		return array.reduce((p, c) => p + c, 0) / array.length
	},
	sum (array) {
		return array.reduce((sum, val) => { return sum + val }, 0)
	}
}
