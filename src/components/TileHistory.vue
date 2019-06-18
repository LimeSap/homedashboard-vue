<template>
<div class="tile-history" :class="tile.__entities.length">
	<EntityHistory v-for="entity in tile.__entities" :key="entity.$id" :history="entity._history" :tile="tile" :mini="true" />
</div>
</template>

<script>
import EntityHistory from '@/components/EntityHistory'

export default {
	name: 'TileHistory',
	components: {
		EntityHistory
	},
	props: {
		tile: {}
	},
	data () {
		return {
			config: {
				mini: true
			}
		}
	}
}
</script>

<style scoped lang="scss">
	@import "@/assets/scss/common.scss";

	.tile-history {
		display: block;
		height: 100%;
	}
</style>
