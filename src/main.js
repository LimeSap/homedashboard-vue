import Vue from 'vue'
import VueNativeSock from 'vue-native-websocket'
import VueLogger from 'vuejs-logger'

import App from './App.vue'
import router from './router'
import socket from './socket'
import store from './store/'

// Logging
Vue.use(VueLogger, {
	isEnabled: true,
	logLevel: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
	stringifyArguments: false,
	showLogLevel: true,
	showMethodName: true,
	separator: '|',
	showConsoleColors: true
})

// Sockets
Vue.use(VueNativeSock, 'wss://briars.duckdns.org/api/websocket', {
	format: 'json',
	connectManually: true,
	reconnection: true,
	reconnectionAttempts: 5,
	reconnectionDelay: 3000
})

var vm = new Vue(socket)
vm.$connect()
vm.getConfig()

Vue.config.productionTip = true

new Vue({
	router,
	store,
	render: h => h(App)
}).$mount('#app')
