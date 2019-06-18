import Vue from 'vue'
import Vuex from 'vuex'
import VuexORM from '@vuex-orm/core'
import VuexORMAxios from '@vuex-orm/plugin-axios'
import database from './database'

Vue.use(Vuex)

VuexORM.use(VuexORMAxios, {
	database,
	http: {
		baseURL: 'https://briars.duckdns.org',
		url: '/api/states/',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		}
	}
})

export default () => new Vuex.Store({
	plugins: [VuexORM.install(database)]
})
