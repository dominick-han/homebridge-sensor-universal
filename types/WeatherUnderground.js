module.exports = function(config) {
	return {
		config: config,
		interval: config.interval ? Math.max(config.interval, 5) : 0,
		sensors: ['T', 'H'],
		process: function (body) {
			return {T: body.current_observation.temp_c, H:parseInt(body.current_observation.relative_humidity)}
		},
		url: encodeURI(`http://api.wunderground.com/api/${config.key}/conditions/q/${config.location}.json`),
		serial: config.location
	}
};
