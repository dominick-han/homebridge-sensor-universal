module.exports = function(config) {
	return {
		config: config,
		interval: config.interval,
		sensors: config.sensor ? [config.sensor.substring(0, 1).toUpperCase()] : ['T', 'H'],
		process: function (body) {
			return {T: body[this.config["temperature-name"] || "temperature"]
						+ (this.config["temperature-offset"] || 0),
					H: body[this.config["humidity-name"] || "humidity"]
						+ (this.config["humidity-offset"] || 0)}
		},
		url: config.url
	}
};
