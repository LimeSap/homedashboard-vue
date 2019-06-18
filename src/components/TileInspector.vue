<template>
	<div class="tile-inspector">
		<div class="tile-inspector__head" :style="{'background-color': `${color}`}">
			<span class="tile-inspector__head-icon mdi" :class="`mdi-${tile.inspector_icon}`"></span>
			<div class="tile-inspector__head-group">
				<div class="tile-inspector__head-title">{{ valueLabel }}</div>
				<div class="tile-inspector__head-sub">{{ tile.name }}</div>
			</div>
		</div>
		<div class="tile-inspector__body">
			<div v-if="tile.inspector_widget !== 'none'" class="tile-inspector__widget">
				<apexchart type="area" height="150" :options="chartOptions" :series="series" />
			</div>
			<div class="tile-inspector__entities" :class="`tile-inspector__entities--${entityCount}`">
				<div class="tile-inspector__entity-row" v-for="entity in tile.__entities" :key="entity.$id">
					<div class="tile-inspector__entity-name">{{ entity.attributes.friendly_name }}</div>
					<div class="tile-inspector__entity-history">
						<EntityHistory :history="entity._history" :tile="tile" :mini="false" />
					</div>
				</div>
				<div class="tile-inspector__timespan">
					<div class="tile-inspector__timespan-time" v-for="(time, index) in times" :key="index" :class="{'tile-inspector__timespan-time--last': index === 12}">{{ time }}</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import Vue from 'vue'
import VueApexCharts from 'vue-apexcharts'
import { isEqual } from 'lodash'
import moment from 'moment'

import Entity from '@/models/Entity'
// import EntityCard from '@/components/EntityCard'
import EntityHistory from '@/components/EntityHistory'

Vue.component('apexchart', VueApexCharts)

export default {
	name: 'TileInspector',
	components: {
		EntityHistory
	},
	props: {
		tile: {},
		config: {
			mini: false
		}
	},
	data () {
		return {
			graphDataPollHandler: null,
			entitiesLoaded: false,
			value: null,
			valueLabel: null,
			color: null,
			percentage: 0,
			history: [],
			entityCount: 0,
			times: [],
			series: [],
			chartOptions: {
				chart: {
					sparkline: {
						enabled: true
					}
				},
				colors: ['#dddddd'],
				yaxis: {
					min: this.tile.state_range[0],
					max: this.tile.state_range[1]
				}
			}
		}
	},
	methods: {
		async init () {
			await this.tile.load()
			this.entitiesLoaded = true
			this.entityCount = this.tile.entity_ids.length
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
					Vue.$log.info(`TileInspector::watch::entityValues::${this.tile.id} State Changed`)
					this.value = this.tile.value
					this.valueLabel = this.tile.calcLabel(this.value)
					this.color = this.tile.calcColor(this.value)
					this.percentage = this.tile.calcPercentage(this.value)
					this.history = await this.tile.history

					this.chartOptions = {
						...this.chartOptions,
						...{
							colors: [this.color]
						}
					}

					const newSeries = await this.tile.calcSeries(this.history)

					this.series = [...newSeries]

					this.times = []
					if (this.history.length > 0) {
						Object.keys(this.history[0]).forEach((time, index) => {
							if (Math.abs(index % 2) === 1) {
								this.times.push(moment(time, 'YYYYMMDDHHmm').format('HH:mm'))
							} else {
								this.times.push(' ')
							}
						})
					}
				}
			},
			deep: false,
			immediate: true
		}
	}
}
</script>

<style scoped lang='scss'>
@import "@/assets/scss/common.scss";

.tile-inspector {
	display: block;
	height: auto;
	margin: $tile-margin;
	border-radius: $tile-radius;
	box-sizing: border-box;
	overflow: hidden;
	background: $tile-inspector-bg;
	transition: all 3s;

	.tile-inspector__head {
		position: relative;
		display: block;
		width: 100%;
		height: $tile-inspector-head-h;
		line-height: 1;
		font-size: 16px;
		color: $tile-head-c;
		padding: $tile-padding;
		text-overflow: ellipsis;
		box-sizing: border-box;
		background-color: $tile-bg;
		color: #fff;
		border-top-left-radius: $tile-radius;
		border-top-right-radius: $tile-radius;
		transition: all 1s;

		&:before { @include tile-effect; }

		&-icon {
			font-size: 50px;
			display: inline-block;
			vertical-align: top;
			margin-right: 10px;
		}

		&-group {
			display: inline-block;
			vertical-align: top;
			padding: 6px 0;
		}

		&-title {
			font-size: 20px;
			margin-bottom: 6px;
		}

		&-sub {
			font-size: 12px;
			text-transform: uppercase;
		}
	}

	.tile-inspector__body {
		display: block;
		position: relative;
		width: 100%;
		max-height: $tile-inspector-body-h;
		color: $tile-bg;
		box-sizing: border-box;
		border-bottom-left-radius: $tile-radius;
		border-bottom-right-radius: $tile-radius;
		overflow: none;
		overflow-y: auto;
		padding: $tile-margin;
	}

	.tile-inspector__entity-row {
		display: block;
		margin: $tile-margin 0;
	}

	.tile-inspector__entity-name {
		display: block;
		margin: 0 $tile-margin;
		color: #777;
		font-size: 14px;
	}

	.tile-inspector__timespan {
		display: flex;
		flex-wrap: nowrap;

		&-time {
			flex-grow: 1;
			flex-basis: 1%;
			text-align: center;
			padding: 0 $tile-margin;
			color: #ddd;
			font-size: 10px;
		}
	}

	.tile-inspector__widget {
		display: block;
		margin: 20px 0;
	}
}
</style>
