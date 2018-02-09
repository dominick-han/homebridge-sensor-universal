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
			.on('get', this.getTState.bind(this))
			.setProps({
				minValue: -99,
				maxValue: 999
			});

		this.humidityService = new Service.HumiditySensor(this.name);
		this.humidityService
			.getCharacteristic(Characteristic.CurrentRelativeHumidity)
			.on('get', this.getHState.bind(this));

		setInterval(this.updateState.bind(this), 1000);

		return [this.informationService, this.temperatureService, this.humidityService];
	},

	getTState: function(callback) {
		this.updateState(callback, "t");
	},

	getHState: function(callback) {
		this.updateState(callback, "h");
	},

	updateState: function(callback, type) {
		request.get({url: this.url}, (error, res, body) => {
			if (!error) {
				let value = {};
				value.T= JSON.parse(body).temperature;
				this.temperatureService.setCharacteristic(Characteristic.CurrentTemperature, value.T);
				value.H = JSON.parse(body).humidity;
				this.humidityService.setCharacteristic(Characteristic.CurrentRelativeHumidity, value.H);
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