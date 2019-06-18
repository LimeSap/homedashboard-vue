import Vue from 'vue'
import { Model } from '@vuex-orm/core'
import axios from 'axios'
import { isEmpty } from 'lodash'
import { extendMoment } from 'moment-range'
import Moment from 'moment'

const moment = extendMoment(Moment)

export default class Entity extends Model {
	static entity = 'entities'
	static primaryKey = 'entity_id'
	static fields () {
		return {
			id: this.increment(),
			entity_id: this.string(''),
			state: this.attr(null),
			attributes: this.attr({}),
			context: this.attr({}),
			_history: this.attr({})
		}
	}

	get history () {
		Vue.$log.info(`Entity::get::history::${this.attributes.friendly_name}`)

		if (isEmpty(this._history)) {
			return this.updateHistory()
		} else {
			return this._history
		}
	}

	async updateHistory () {
		Vue.$log.info(`Entity.updateHistory::${this.attributes.friendly_name}`)

		// Windows Slices
		const resolutionMinutes = 60
		const roundedNow = Math.round(moment().minute() / resolutionMinutes) * resolutionMinutes
		const windowEnd = moment().minute(roundedNow).second(0)
		const windowStart = moment(windowEnd).subtract(24, 'hours')
		const windowRange = moment.range(windowStart, windowEnd)
		let temp = {}
		let array = Array.from(windowRange.by('minutes', { step: resolutionMinutes }))

		// Limit to 24
		while (array.length > 24) {
			array.pop()
		}

		array.forEach(value => { temp[value.format('YYYYMMDDHHmm')] = [] })
		const windowSlices = temp

		// Get Data
		const res = await axios.get(`https://briars.duckdns.org/api/history/period/${moment().subtract(24, 'hours').format('YYYY-MM-DDTHH:mm:ssZ')}`, {
			params: {
				filter_entity_id: this.entity_id,
				end_time: moment().format('YYYY-MM-DDTHH:mm:ssZ')
			}
		})

		// Build Data Object
		let history = windowSlices
		res.data[0].forEach((entityData, entityDataIndex) => {
			const timestamp = moment(entityData.last_updated)
			const roundedSlice = Math.round(timestamp.minute() / resolutionMinutes) * resolutionMinutes
			const slice = timestamp.minute(roundedSlice).second(0).format('YYYYMMDDHHmm')
			if (history[slice] !== undefined) { history[slice].push(entityData.state) }
		})

		this.$update({ _history: history })
		return history
	}
}
