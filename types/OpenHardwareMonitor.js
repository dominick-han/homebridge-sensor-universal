function unpackTemp(input) {
	let output = [];
	for (let child of input.Children) {
		output = output.concat(unpackTemp(child));
	}
	if (input.Text.includes('Temperature')) {
		if (!isNaN(parseFloat(input.Value))) {
			output.push(parseFloat(input.Value));
		}
	}
	return output;
}

module.exports = function(config) {
	return {
		config: config,
		sensors: ['T'],
		process: function (body) {
			return {T: Math.min(...unpackTemp(JSON.parse(body))) + (this.config.offset || 0)}
		},
		url: config.url.replace(/\/+$/, '') + '/data.json'
	}
};
