import Vue from 'vue'
import { Model } from '@vuex-orm/core'
import { round } from 'lodash'
import chroma from 'chroma-js'
import moment from 'moment'

import Helpers from '@/common/Helpers'
import Reduce from '@/common/Reduce'
import Entity from '@/models/Entity'

export default class Tile extends Model {
	static entity = 'tiles'
	static fields () {
		return {
			// Core Values
			id: this.string(''),
			name: this.string(''),
			domain: this.attr(''),
			group: this.attr(''),
			entity_ids: this.attr([]),
			// State options
			state_type: this.string('float'),
			state_merge: this.string('average'),
			state_precision: this.number(2),
			state_range: this.attr([0, 100]),
			// History options
			history_interval: this.number(180000),
			// Preview options
			preview_widget: this.string('text'),
			// Inspector options
			inspector_icon: this.string('gauge'),
			inspector_widget: this.string('none'),
			inspector_widget_merge: this.string('sum'),
			// Other
			breakpoints: this.attr([]),
			// Populated values
			__entities: this.hasManyBy(Entity, 'entity_ids')
		}
	}

	get value () {
		Vue.$log.info(`Tile::get::value::${this.id}`)
		const entities = Entity.findIn(this.entity_ids)

		let values = []
		entities.forEach(entity => values.push(entity.state))

		values = Helpers.parseValues(values, this)
		let value = Reduce.process(values, this.state_merge)
		if (this.state_type === 'float') { value = round(value, this.state_precision) }

		return value
	}

	calcLabel (value) {
		Vue.$log.info(`Tile::calcLabel::${this.id}`)
		if (this.breakpoints.length) {
			const labelBreakpoints = this.breakpoints.filter(bp => bp.label !== undefined)
			const labels = labelBreakpoints.map(bp => bp.label)
			const values = labelBreakpoints.map(bp => bp.value)

			const valuePosition = values.indexOf(value)
			if (valuePosition > -1) { value = labels[valuePosition] }
		}
		return value
	}

	calcIcon (value) {
		Vue.$log.info(`Tile::calcIcon::${this.id}`)
		let icon = null
		if (this.breakpoints.length) {
			const iconBreakpoints = this.breakpoints.filter(bp => bp.icon !== undefined)
			const icons = iconBreakpoints.map(bp => bp.icon)
			const values = iconBreakpoints.map(bp => bp.value)

			const valuePosition = values.indexOf(value)
			if (valuePosition > -1) { icon = icons[valuePosition] }
		}
		return icon
	}

	calcPercentage (value) {
		Vue.$log.info(`Tile::calcPercentage::${this.id}`)
		let percentage = 0

		switch (this.state_type) {
		case 'int':
		case 'float':
		case 'bool':
			percentage = round(Math.max(Math.min(((value - this.state_range[0]) * 100) / (this.state_range[1] - this.state_range[0]), 100), 0), this.state_precision)
			break
		default:
			break
		}

		return percentage
	}

	get percentage () {
		Vue.$log.info(`Tile::get::percentage::${this.id}`)
		return this.calcPercentage(this.value)
	}

	calcColor (value) {
		Vue.$log.info(`Tile::calcColor::${this.id}`)
		let color = null
		if (this.breakpoints.length) {
			const colorBreakpoints = this.breakpoints.filter(bp => bp.color !== undefined)
			const colors = colorBreakpoints.map(bp => bp.color)
			const values = colorBreakpoints.map(bp => bp.value)

			if (value > 0) {
				switch (this.state_type) {
				case 'int':
				case 'float':
					const scale = chroma.scale(colors).domain(values)
					color = scale(value).hex()
					break
				case 'boolean':
					const boolPosition = values.indexOf(value > 0 ? 1 : 0)
					if (boolPosition > -1) { color = colors[boolPosition] }
					break
				default:
					const valuePosition = values.indexOf(value)
					if (valuePosition > -1) { color = colors[valuePosition] }
					break
				}
			}
		}
		return color
	}

	async calcSeries (history) {
		Vue.$log.info(`Tile::calcSeries::${this.id}`)

		let result = []

		if (history.length > 0) {
			const timestamps = Object.keys(history[0])

			let series = {
				name: this.name,
				data: []
			}

			timestamps.forEach(key => {
				let values = []

				history.forEach(entity => {
					if (entity[key] !== null && entity[key].length > 0) {
						values.push(Reduce.average(Helpers.parseValues(entity[key], this)))
					} else {
						values.push(null)
					}
				})

				switch (this.inspector_widget_merge) {
				case 'sum':
					values = round(Reduce.sum(values), this.state_precision)
					break
				default:
					values = round(Reduce.average(values), this.state_precision)
					break
				}

				series.data.push({
					x: moment(key, 'YYYYMMDDHHmm').format('HH:mm'),
					y: values
				})
			})

			result.push(series)
		}

		return result
	}

	get color () {
		Vue.$log.info(`Tile::get::color::${this.id}`)
		return this.calcColor(this.value)
	}

	get history () {
		return (async () => {
			Vue.$log.info(`Tile::get::history::${this.id}`)
			const entities = Entity.findIn(this.entity_ids)
			let history = []

			// use state_type & state_precision to format history data
			entities.forEach(async (entity) => {
				const entityHistory = await entity.history
				history.push(entityHistory)
			})

			return history
		})()
	}

	async load () {
		Vue.$log.info(`Tile.load::${this.id}`)
		// Get all linked Entities
		await Promise.all(this.entity_ids.map(async (entity) => {
			await Entity.$get({
				params: {
					id: entity
				}
			})
		}))
		return true
	}
}
