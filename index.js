let Service, Characteristic;
const request = require('request');

module.exports = function(homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	homebridge.registerAccessory('homebridge-sensor-universal', 'UniversalSensor', UniversalSensor);
};

// Import from directory
let types = {};
let normalizedPath = require('path').join(__dirname, 'types');
require('fs').readdirSync(normalizedPath).forEach(function(file) {
	types[file.substring(0, file.indexOf('.'))] = require('./types/' + file);
});

function UniversalSensor(log, config) {
	let params = ['url', 'name', 'manufacturer', 'model', 'serial'];
	for (let i in params) {
		this[params[i]] = config[params[i]];
	}
	this.log = log;
	this.type = types[config.type.name](config.type);
}

UniversalSensor.prototype = {
	getServices: function() {
		this.informationService = new Service.AccessoryInformation();
		this.informationService
			.setCharacteristic(Characteristic.Manufacturer, this.manufacturer || 'Dominick Han')
			.setCharacteristic(Characteristic.Model, this.model || 'Universal Sensor')
			.setCharacteristic(Characteristic.SerialNumber, this.serial || 'N/A');

		let services = [this.informationService];

		if (this.type.sensors.includes('T')) {
			this.temperatureService = new Service.TemperatureSensor(this.name);
			this.temperatureService
				.getCharacteristic(Characteristic.CurrentTemperature)
				.on('get', this.getState('T').bind(this))
				.setProps({
					minValue: -99,
					maxValue: 999
				});
			services.push(this.temperatureService);
			this.log("Initialized temperature sensor");
		}

		if (this.type.sensors.includes('H')) {
			this.humidityService = new Service.HumiditySensor(this.name);
			this.humidityService
				.getCharacteristic(Characteristic.CurrentRelativeHumidity)
				.on('get', this.getState('H').bind(this));
			services.push(this.humidityService);
			this.log("Initialized humidity sensor");
		}

		setInterval(this.updateState.bind(this), 1000);

		return services;
	},

	getState: function(type) {
		return function(callback) {
			this.updateState(callback, type);
		}
	},

	updateState: function(callback, type) {
		let updates = type ? [type] : this.type.sensors;
		request.get({url: this.type.config.url}, (error, res, body) => {
			if (!error) {
				let value = this.type.process(body);
				if (updates.includes('T')) {
					this.temperatureService.setCharacteristic(Characteristic.CurrentTemperature, value.T);
				}
				if (updates.includes('H')) {
					this.humidityService.setCharacteristic(Characteristic.CurrentRelativeHumidity, value.H);
				}
				if (callback) {
					callback(null, value[type]);
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