import Vue from 'vue'
import axios from 'axios'
import { round } from 'lodash'
import { extendMoment } from 'moment-range'
import Moment from 'moment'

import Reduce from '@/common/Reduce'

const moment = extendMoment(Moment)

export default {
	async refresh (tile) {
		Vue.$log.info(`Tile.refeshGraphData::${tile.id}`)

		// Windows Slices
		const resolutionMinutes = tile.historyResolutionMinutes
		const roundedNow = Math.round(moment().minute() / resolutionMinutes) * resolutionMinutes
		const windowEnd = moment().minute(roundedNow).second(0)
		const windowStart = moment(windowEnd).subtract(tile.historyPastHours, 'hours')
		const windowRange = moment.range(windowStart, windowEnd)
		let temp = {}
		Array.from(windowRange.by('minutes', { step: resolutionMinutes })).map((v, i) => { temp[v.format('YYYYMMDDHHmm')] = null })
		const windowSlices = temp

		// Get Data
		const res = await axios.get(`https://briars.duckdns.org/api/history/period/${moment().subtract(tile.historyPastHours, 'hours').format('YYYY-MM-DDTHH:mm:ssZ')}`, {
			params: {
				filter_entity_id: tile.entity_ids.join(','),
				end_time: moment().format('YYYY-MM-DDTHH:mm:ssZ')
			}
		})

		// Build Data Object
		let graphData = []
		tile._entities.forEach((entity, entityID) => {
			graphData[entityID] = { ...windowSlices }
			res.data[entityID].forEach((entityData, entityDataIndex) => {
				const timestamp = moment(entityData.last_updated)
				const roundedSlice = Math.round(timestamp.minute() / resolutionMinutes) * resolutionMinutes
				const slice = timestamp.minute(roundedSlice).second(0).format('YYYYMMDDHHmm')

				if (graphData[entityID][slice] === null) { graphData[entityID][slice] = [] }

				const value = entityData.state
				if (!isNaN(value)) { graphData[entityID][slice].push(parseFloat(entityData.state)) }

				switch (tile.type) {
				case 'int':
					let tempInt = parseInt(entityData.state)
					if (!isNaN(tempInt)) { graphData[entityID][slice].push(tempInt) }
					break
				case 'float':
					let tempFloat = parseFloat(entityData.state)
					if (!isNaN(tempFloat)) { graphData[entityID][slice].push(tempFloat) }
					break
				case 'bool':
					graphData[entityID][slice].push(entityData.state === 'on' ? 1 : 0)
					break
				default:
					graphData[entityID][slice].push(entityData.state)
					break
				}
			})
		})

		// Process Data
		graphData.forEach((entity, entityID) => {
			Object.keys(entity).forEach(datasetIndex => {
				if (graphData[entityID][datasetIndex] === null) {
					graphData[entityID][datasetIndex] = null
				} else {
					switch (tile.type) {
					case 'int':
						graphData[entityID][datasetIndex] = round(Reduce.process(graphData[entityID][datasetIndex], tile.merge))
						break
					case 'float':
						graphData[entityID][datasetIndex] = round(Reduce.process(graphData[entityID][datasetIndex], tile.merge), tile.precision)
						break
					case 'bool':
						graphData[entityID][datasetIndex] = Reduce.process(graphData[entityID][datasetIndex], 'sum')
						break
					default:
						graphData[entityID][datasetIndex] = Reduce.process(graphData[entityID][datasetIndex], tile.merge)
						break
					}
				}
			})
		})

		return graphData
	},

	async line (tile) {
		const chartData = await this.refresh(tile)

		let line = []

		chartData.forEach((row, rowIndex) => {
			const rowKeys = Object.values(row)
			line.push({
				name: tile._entities[rowIndex].$id,
				data: rowKeys.slice(Math.max(rowKeys.length - 24, 1))
			})
		})

		return line
	}
}
