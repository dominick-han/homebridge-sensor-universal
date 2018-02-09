let Service, Characteristic;
const request = require("request");

module.exports = function(homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	homebridge.registerAccessory('homebridge-sensor-universal', 'UniversalSensor', UniversalSensor);
};

function UniversalSensor(log, config) {
	let params = ['url', 'name', 'manufacturer', 'model', 'serial'];
	for (let i in params) {
		this[params[i]] = config[params[i]];
	}
	this.log = log;
}

UniversalSensor.prototype = {
	getServices: function() {
		this.informationService = new Service.AccessoryInformation();
		this.informationService
			.setCharacteristic(Characteristic.Manufacturer, this.manufacturer || 'Dominick Han')
			.setCharacteristic(Characteristic.Model, this.model || 'Universal Sensor')
			.setCharacteristic(Characteristic.SerialNumber, this.serial || 'N/A');

		this.temperatureService = new Service.TemperatureSensor(this.name);
		this.temperatureService
			.getCharacteristic(Characteristic.CurrentTemperature)
			.on('get', this.getState.bind(this))
			.setProps({
				minValue: -99,
				maxValue: 999
			});

		setInterval(this.updateState.bind(this), 1000);

		return [this.informationService, this.temperatureService];
	},

	getState: function(callback) {
		this.updateState(callback);
	},

	updateState: function(callback) {
		request.get({url: this.url}, (error, res, body) => {
			if (!error) {
				let value = JSON.parse(body).temperature;
				this.temperatureService.setCharacteristic(Characteristic.CurrentTemperature, value);
				if (callback) {
					callback(null, value);
				}
			} else {
				this.log(error);
				if (callback) {
					callback(error);
				}
			}
		});
	}
};