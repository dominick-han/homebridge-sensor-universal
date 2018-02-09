module.exports = function(config) {
	return {
		config: config,
		sensors: config.sensor ? [config.sensor.substring(0, 1).toUpperCase()] : ['T', 'H'],
		process: function (body) {
			return {T: JSON.parse(body).temperature, H: JSON.parse(body).humidity}
		},
		url: config.url
	}
};
