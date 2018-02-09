let Service, Characteristic;
const request = require('request');

module.exports = function(homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	homebridge.registerAccessory('homebridge-sensor-universal', 'UniversalSensor', UniversalSensor);
};

const convert = {'H': 'humidity','T': 'temperature',  'humidity': 'H', 'temperature': 'T'};

// Import from directory
let types = {};
let normalizedPath = require('path').join(__dirname, 'types');
require('fs').readdirSync(normalizedPath).forEach(function(file) {
	types[file.substring(0, file.indexOf('.'))] = require('./types/' + file);
});

function UniversalSensor(log, config) {
	let params = ['url', 'name', 'manufacturer', 'model'];
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
			.setCharacteristic(Characteristic.SerialNumber, this.type.serial || this.type.url || 'N/A');

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

		if (this.type.interval !== 0){
			setInterval(this.updateState.bind(this), (this.type.interval || 1) * 60000);
		}

		return services;
	},

	getState: function(type) {
		return function(callback) {
			this.updateState(callback, type);
		}
	},

	updateState: function(callback, type) {
		let updates = type ? [type] : this.type.sensors;
		request.get({url: this.type.url, json: true}, (error, res, body) => {
			if (!error) {
				let value = this.type.process(body);
				if (updates.includes('T')) {
					this.temperatureService.setCharacteristic(Characteristic.CurrentTemperature, value.T);
				}
				if (updates.includes('H')) {
					this.humidityService.setCharacteristic(Characteristic.CurrentRelativeHumidity, value.H);
				}
				if (callback) {
					this.log("Updated", convert[type], "to", value[type]);
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