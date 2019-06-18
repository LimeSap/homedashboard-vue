import Vue from 'vue'
import axios from 'axios'

import Tile from '@/models/Tile'
import Entity from '@/models/Entity'

export default {
	methods: {
		async getConfig () {
			const res = await axios.get('https://briars.duckdns.org/local/config.json')
			axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
			Vue.prototype.$http = axios

			// Insert tiles & create list of entities
			let entities = []
			res.data.tiles.forEach(tile => {
				Tile.insert({ data: tile })
				entities.push(...tile.entity_ids)
			})

			// GET the entity values from server
			const uniqueEntities = new Set(entities)
			await uniqueEntities.forEach(entity => {
				Entity.$get({
					params: {
						id: entity
					}
				})
			})

			this.socketAuth(res.data.token)
		},
		socketAuth: function (token) {
			this.$options.sockets.onmessage = (data) => {
				const res = JSON.parse(data.data)
				switch (res.type) {
				case 'auth_required':
					this.$socket.sendObj({
						type: 'auth',
						access_token: token
					})
					break
				case 'auth_ok':
					this.$socket.sendObj({
						id: 1,
						type: 'subscribe_events'
					})
					break
				case 'result':
					// console.log('result', res.success)
					break
				case 'event':
					const entity = Entity.find(res.event.data.entity_id)
					if (entity && entity.state !== res.event.data.new_state.state) {
						Entity.update({
							where: res.event.data.entity_id,
							data: {
								state: res.event.data.new_state.state
							}
						})
					}
					break
				default:
					// console.log('unhandled socket type', res)
					break
				}
			}
		}
	}
}
