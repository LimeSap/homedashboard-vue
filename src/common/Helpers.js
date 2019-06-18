import { round } from 'lodash'

import Reduce from '@/common/Reduce'

export default {
	parseValue (value, tile) {
		switch (tile.state_type) {
		case 'int':
			return round(parseInt(value), tile.state_precision)
		case 'float':
			return round(parseFloat(value), tile.state_precision)
		case 'boolean':
			return value === 'on' ? 1 : 0
		default:
			return value
		}
	},
	parseValues (values, tile) {
		return values.map((value) => this.parseValue(value, tile))
	},
	tileHistory (history, tile) {
		let result = []
		history.forEach(entityObj => {
			result.push(this.entityHistory(entityObj, tile))
		})
		return result
	},
	entityHistory (history, tile) {
		let result = []
		Object.values(history).forEach(hour => {
			let values = hour.map(value => {
				return this.parseValue(value, tile)
			})

			if (values.length > 0) {
				switch (tile.state_type) {
				case 'boolean':
					result.push(Reduce.average(values) > 0 ? 1 : 0)
					break
				case 'int':
				case 'float':
				default:
					result.push(round(Reduce.average(values), tile.state_precision))
					break
				}
			} else {
				result.push(null)
			}
		})
		return result
	}
}
