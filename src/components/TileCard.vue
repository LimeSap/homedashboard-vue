<template>
<div class="tile" :style="{'background-color': `${color}`}" @click.prevent.stop="setAsActiveTile">
	<div class="tile__head">{{ tile.name }}</div>
	<div v-if="tile.preview_widget === 'percentage'" class="tile__body tile__body--bar">
		<div class="tile__body__bar" :style="{'width': `${percentage}%` }"></div>
	</div>
	<div v-else-if="tile.preview_widget === 'history'" class="tile__body tile__body--history">
		<TileHistory :history="history" :tile="tile" />
	</div>
	<div v-else class="tile__body tile__body--text">{{ value }}</div>
</div>
</template>

<script>
import Vue from 'vue'
import { isEqual } from 'lodash'

import Entity from '@/models/Entity'
import TileHistory from '@/components/TileHistory'
import { setInterval } from 'timers'

export default {
	name: 'TileCard',
	components: {
		TileHistory
	},
	props: {
		tile: {}
	},
	data () {
		return {
			graphDataPollHandler: null,
			entitiesLoaded: false,
			value: null,
			color: null,
			percentage: 0,
			history: []
		}
	},
	methods: {
		async init () {
			await this.tile.load()
			this.entitiesLoaded = true

			this.graphDataPollHandler = setInterval(async () => {
				Vue.$log.info(`TileCard::interval::${this.tile.id} Update history`)
				this.history = await this.tile.history
			}, this.tile.history_interval)
		},
		setAsActiveTile () {
			this.$emit('setActiveTile', this.tile.id)
		}
	},
	mounted () {
		this.init()
	},
	beforeDestroy () {
		clearInterval(this.graphDataPollHandler)
	},
	computed: {
		entityValues () {
			return Entity.findIn(this.tile.entity_ids).map(entity => entity.state)
		}
	},
	watch: {
		entityValues: {
			handler: async function (newValue, oldValue) {
				if (!isEqual(newValue, oldValue)) {
					Vue.$log.info(`TileCard::watch::entityValues::${this.tile.id} State changed`)
					this.value = this.tile.value
					this.color = this.tile.calcColor(this.value)
					this.percentage = this.tile.calcPercentage(this.value)
					this.history = await this.tile.history
				}
			},
			deep: false,
			immediate: true
		}
	}
}
</script>

<style scoped lang="scss">
	@import "@/assets/scss/common.scss";

	.tile {
		display: inline-block;
		position: relative;
		vertical-align: top;
		box-sizing: border-box;
		overflow: hidden;
		transition: all 1s;

		width: $tile-w;
		height: $tile-h;
		margin: $tile-margin;
		border-radius: $tile-radius;
		background-color: $tile-bg;

		&:before { @include tile-effect; }

		.tile__head {
			display: block;
			position: relative;
			z-index: 1;
			width: 100%;
			height: $tile-head-h;
			line-height: 1;
			font-size: $tile-head-f-s;
			color: $tile-head-c;
			padding: $tile-padding;
			text-overflow: ellipsis;
			box-sizing: border-box;
			white-space: nowrap;
			overflow: hidden;
		}

		.tile__body {
			display: block;
			position: relative;
			z-index: 1;
			width: 100%;
			height: $tile-body-h;
			color: $tile-body-c;
			box-sizing: border-box;

			&--text {
				padding: $tile-padding;
				text-align: center;
				font-size: $tile-body-f-s;
				line-height: 0.5;
			}

			&__bar {
				display: block;
				width: 0%;
				height: 100%;
				background: $tile-fg-c;
				border-right: $tile-fg-border;
				transition: width 1s
			}
		}
	}
</style>
