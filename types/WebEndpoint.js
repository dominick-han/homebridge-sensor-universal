module.exports = function(config) {
	sensors = config.sensor ? [config.sensor.substring(0, 1).toUpperCase()] : ['T', 'H'];
	return {
		config: config,
		sensors: sensors,
		process: function (body) {
			return {T: JSON.parse(body).temperature, H: JSON.parse(body).humidity}
		}
	}
};
