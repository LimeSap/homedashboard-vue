module.exports = {
	plugins: ['lodash', '@babel/plugin-proposal-class-properties'],
	presets: [
		[
			'@babel/preset-env', {
				'targets': {
					'node': 'current'
				}
			}
		]
	]
}
