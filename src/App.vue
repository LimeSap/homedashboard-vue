<template>
<div id="app">
	<!-- <div id="nav">
		<router-link to="/">Home</router-link> |
		<router-link to="/about">About</router-link>
	</div> -->
	<router-view />
</div>
</template>

<style lang="scss">
	@import "@/assets/scss/common.scss";

	#app {
		margin: ($tile-margin * 2) $tile-margin;
	}
</style>
