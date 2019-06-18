<template>
<div class="entity-history" :class="{'entity-history--mini': mini}">
	<div class="entity-history__bar" v-for="(cell, index) in cells" :key="index" :style="{'background-color': mini ? null : `${cell.color}`}" :class="[`entity-history__bar--${cell.span}`, (mini && cell.value > 0) ? 'entity-history__bar--active' : null]"></div>
</div>
</template>

<script>
import { isEqual } from 'lodash'

import Helpers from '@/common/Helpers'

export default {
	name: 'entityHistory',
	props: {
		history: {},
		tile: {},
		mini: null
	},
	data () {
		return {
			cells: []
		}
	},
	methods: {
		spanCount (index) {
			let span = 0

			if (this.historyData[index] === this.historyData[index + 1]) {
				span = this.spanCount(index + 1)
			}

			return span
		}
	},
	watch: {
		history: {
			handler: function (newValue, oldValue) {
				if (!isEqual(newValue, oldValue)) {
					let historyData = Helpers.entityHistory(newValue, this.tile)

					let cells = []
					historyData.forEach((value, key) => {
						let span = 1

						// Calculate spans
						if (!this.mini && value !== historyData[key - 1]) {
							let chainBroken = false

							for (let i = key + 1; i < historyData.length; i++) {
								if (value === historyData[i] && !chainBroken) {
									span++
								} else {
									chainBroken = true
								}
							}

							// Color
							let color = this.tile.calcColor(value)

							// Push
							cells.push({
								value,
								span,
								color
							})
						} else if (this.mini) {
							cells.push({
								value,
								span: 1,
								color: null
							})
						}
					})

					this.cells = [...cells]
				}
			},
			deep: true,
			immediate: true
		}
	}
}
</script>

<style scoped lang="scss">
	@import "@/assets/scss/common.scss";

	$cell-w: 2.166667; // 4.166667%
	$cell-m: 1;

	$cell-w-medium: 2.566667;
	$cell-m-medium: .75;

	$cell-w-large: 3.166667;
	$cell-m-large: .5;

	$cell-w-xlarge: 3.566667;
	$cell-m-xlarge: .25;

	.entity-history {
		display: flex;
		height: 100%;
		width: 100%;

		&--mini {
			height: auto;

			.entity-history__bar {
				margin-top: 2px;
				margin-bottom: 2px;
				height: 6px;
				background-color: rgba(0, 0, 0, .2);

				&--active {
					background-color: rgba(255, 255, 255, .5)
				}

				&:before {
					display: none;
				}
			}
		}

		&__bar {
			position: relative;
			display: inline-block;
			vertical-align: top;
			height: $entity-history-h;
			margin: $tile-margin 0;
			border-radius: $tile-radius;
			background-color: $tile-bg;
			transition: all 1s;

			flex-grow: $cell-w;
			margin-left: percentage($cell-m/100);
			margin-right: percentage($cell-m/100);

			&:before { @include tile-effect; }

			@for $i from 1 through 24 {
				&--#{$i} {
					flex-grow: ($cell-w * $i) + ($cell-m * (($i * 2) - 2));

					@media (min-width: 500px) {
						margin-left: percentage($cell-m-medium/100);
						margin-right: percentage($cell-m-medium/100);
						flex-grow: ($cell-w-medium * $i) + ($cell-m-medium * (($i * 2) - 2));
					}

					@media (min-width: 992px) {
						margin-left: percentage($cell-m-large/100);
						margin-right: percentage($cell-m-large/100);
						flex-grow: ($cell-w-large * $i) + ($cell-m-large * (($i * 2) - 2));
					}

					@media (min-width: 1200px) {
						margin-left: percentage($cell-m-xlarge/100);
						margin-right: percentage($cell-m-xlarge/100);
						flex-grow: ($cell-w-xlarge * $i) + ($cell-m-xlarge * (($i * 2) - 2));
					}
				}
			}
		}
	}
</style>
