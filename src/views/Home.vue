<template>
<div class="view-home" @click.prevent="clearActiveTile">
	<TileInspector v-if="activeTileID" :key="activeTile.id" :tile="activeTile"/>
	<TileCard v-for="(tile, index) in tilesAll" :key="index" :tile="tile" @setActiveTile="setActiveTile"/>
</div>
</template>

<script>
import Tile from '@/models/Tile'
import TileCard from '@/components/TileCard.vue'
import TileInspector from '@/components/TileInspector.vue'

export default {
	name: 'home',
	components: {
		TileCard,
		TileInspector
	},
	data () {
		return {
			activeTileID: null
		}
	},
	methods: {
		setActiveTile (value) {
			this.$log.info(`setActiveTile`, value)
			this.activeTileID = value
		},
		clearActiveTile () {
			this.$log.info(`clearActiveTile`)
			this.activeTileID = null
		}
	},
	computed: {
		tilesAll () {
			return Tile.query().with('__entities').all()
		},
		activeTile () {
			return this.activeTileID ? Tile.query().with('__entities').find(this.activeTileID) : false
		}
	},
	mounted () {}
}
</script>
