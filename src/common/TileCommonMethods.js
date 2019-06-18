// import Vue from 'vue'
// import { round } from 'lodash'
// import chroma from 'chroma-js'
// import axios from 'axios'
// import { extendMoment } from 'moment-range'
// import Moment from 'moment'
//
// import Reduce from '@/common/Reduce'
//
// const moment = extendMoment(Moment)
//
// export default {
// 	getValues (data) { return Object.values(data.allValues).map(entity => { return entity.value }) },
// 	getEntityPercents (data) { return Object.values(data.allValues).map(entity => { return entity.percent }) },
// 	getPercentage (tile, value) { return Math.max(Math.min(round(((value - tile.range[0]) / (tile.range[1] - tile.range[0])) * 100, tile.precision), 100), 0) },
// 	updateValues (tile, data) {
// 		Vue.$log.info(`TileCommonMethods.updateValues::${tile.id}`)
//
// 		// Get and sanitize values
// 		tile._entities.forEach(entity => {
// 			switch (tile.type) {
// 			case 'int':
// 				data.allValues[entity.entity_id] = {
// 					value: parseInt(entity.state),
// 					percent: 0
// 				}
// 				break
// 			case 'float':
// 				data.allValues[entity.entity_id] = {
// 					value: parseFloat(entity.state),
// 					percent: 0
// 				}
// 				break
// 			case 'bool':
// 				data.allValues[entity.entity_id] = {
// 					value: (entity.state === 'on') ? 1 : 0,
// 					percent: 0
// 				}
// 				break
// 			default:
// 				data.allValues[entity.entity_id] = { value: entity.state }
// 				break
// 			}
// 		})
//
// 		return { tile, data }
// 	},
// 	reduceValues ({ tile, data }) {
// 		Vue.$log.info(`TileCommonMethods.reduceValues::${tile.id}`)
//
// 		// Reduce array of values to a single value
// 		switch (tile.type) {
// 		case 'int':
// 			data.mainValue = round(Reduce.process(this.getValues(data), tile.merge))
// 			break
// 		case 'float':
// 			data.mainValue = round(Reduce.process(this.getValues(data), tile.merge), tile.precision)
// 			break
// 		case 'bool':
// 		default:
// 			data.mainValue = Reduce.process(this.getValues(data), tile.merge)
// 			break
// 		}
//
// 		return { tile, data }
// 	},
// 	calculatePercentage ({ tile, data }) {
// 		Vue.$log.info(`TileCommonMethods.calculatePercentage::${tile.id}`)
//
// 		// Calculate entity percentages
// 		tile.entity_ids.forEach(entity => {
// 			switch (tile.type) {
// 			case 'int':
// 			case 'float':
// 				data.allValues[entity].percent = this.getPercentage(tile, data.allValues[entity].value)
// 				break
// 			case 'bool':
// 				data.allValues[entity].percent = (data.allValues[entity].value === 1) ? 100 : 0
// 				break
// 			default:
// 				// Do nothing
// 				break
// 			}
// 		})
//
// 		// Calculate master percentage
// 		switch (tile.type) {
// 		case 'int':
// 		case 'float':
// 		case 'bool':
// 			data.percentage = this.getPercentage(tile, Reduce.average(this.getEntityPercents(data)))
// 			break
// 		default:
// 			break
// 		}
//
// 		return { tile, data }
// 	},
// 	calculateColor ({ tile, data }) {
// 		Vue.$log.info(`TileCommonMethods.calculateColor::${tile.id}`)
//
// 		// Calculate color
// 		if (tile.breakpoints.length) {
// 			const colorBreakpoints = tile.breakpoints.filter(bp => bp.color !== undefined)
// 			const colors = colorBreakpoints.map(bp => bp.color)
// 			const values = colorBreakpoints.map(bp => bp.value)
//
// 			switch (tile.type) {
// 			case 'int':
// 			case 'float':
// 				const scale = chroma.scale(colors).domain(values)
// 				data.color = scale(data.mainValue).hex()
// 				break
// 			default:
// 				data.color = null
// 				const valuePosition = values.indexOf(data.mainValue)
// 				if (valuePosition > -1) { data.color = colors[valuePosition] }
// 				break
// 			}
// 		}
//
// 		return { tile, data }
// 	},
// 	async graphData (tile, data) {
// 		Vue.$log.info(`TileCommonMethods.calculateColor::${tile.id}`)
//
// 		// Windows Slices
// 		const resolutionMinutes = tile.historyResolutionMinutes
// 		const roundedNow = Math.round(moment().minute() / resolutionMinutes) * resolutionMinutes
// 		const windowEnd = moment().minute(roundedNow).second(0)
// 		const windowStart = moment(windowEnd).subtract(tile.historyPastHours, 'hours')
// 		const windowRange = moment.range(windowStart, windowEnd)
// 		let temp = {}
// 		Array.from(windowRange.by('minutes', { step: resolutionMinutes })).map((v, i) => { temp[v.format('YYYYMMDDHHmm')] = null })
// 		const windowSlices = temp
//
// 		// Get Data
// 		const res = await axios.get(`https://briars.duckdns.org/api/history/period/${moment().subtract(tile.historyPastHours, 'hours').format('YYYY-MM-DDTHH:mm:ssZ')}`, {
// 			params: {
// 				filter_entity_id: tile.entity_ids.join(','),
// 				end_time: moment().format('YYYY-MM-DDTHH:mm:ssZ')
// 			}
// 		})
//
// 		// Build Data Object
// 		let graphData = []
// 		tile._entities.forEach((entity, entityID) => {
// 			graphData[entityID] = { ...windowSlices }
// 			res.data[entityID].forEach((entityData, entityDataIndex) => {
// 				const timestamp = moment(entityData.last_updated)
// 				const roundedSlice = Math.round(timestamp.minute() / resolutionMinutes) * resolutionMinutes
// 				const slice = timestamp.minute(roundedSlice).second(0).format('YYYYMMDDHHmm')
//
// 				if (graphData[entityID][slice] === null) { graphData[entityID][slice] = [] }
//
// 				const value = entityData.state
// 				if (!isNaN(value)) { graphData[entityID][slice].push(parseFloat(entityData.state)) }
//
// 				switch (tile.type) {
// 				case 'int':
// 					let tempInt = parseInt(entityData.state)
// 					if (!isNaN(tempInt)) { graphData[entityID][slice].push(tempInt) }
// 					break
// 				case 'float':
// 					let tempFloat = parseFloat(entityData.state)
// 					if (!isNaN(tempFloat)) { graphData[entityID][slice].push(tempFloat) }
// 					break
// 				case 'bool':
// 					graphData[entityID][slice].push(entityData.state === 'on' ? 1 : 0)
// 					break
// 				default:
// 					graphData[entityID][slice].push(entityData.state)
// 					break
// 				}
// 			})
// 		})
//
// 		// Process Data
// 		graphData.forEach((entity, entityID) => {
// 			Object.keys(entity).forEach(datasetIndex => {
// 				if (graphData[entityID][datasetIndex] === null) {
// 					graphData[entityID][datasetIndex] = null
// 				} else {
// 					switch (tile.type) {
// 					case 'int':
// 						graphData[entityID][datasetIndex] = round(Reduce.process(graphData[entityID][datasetIndex], tile.merge))
// 						break
// 					case 'float':
// 						graphData[entityID][datasetIndex] = round(Reduce.process(graphData[entityID][datasetIndex], tile.merge), tile.precision)
// 						break
// 					case 'bool':
// 					default:
// 						graphData[entityID][datasetIndex] = Reduce.process(graphData[entityID][datasetIndex], tile.merge)
// 						break
// 					}
// 				}
// 			})
// 		})
//
// 		return graphData
// 	}
// }
