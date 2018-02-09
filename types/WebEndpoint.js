module.exports = function(config) {
	return {
		config: config,
		sensors: ['T', 'H'],
		process: function (body) {
			return {T: JSON.parse(body).temperature, H: JSON.parse(body).humidity}
		}
	}
};
