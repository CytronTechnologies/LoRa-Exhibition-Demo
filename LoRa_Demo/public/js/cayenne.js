// cayenne payload structure
var cayennePayloadStruct = {
	"0":{ // LPP_DIGITAL_INPUT
	  name: "digital input",
	  size: 1, 
	  precision: 1,
	},
	"1":{ // LPP_DIGITAL_OUTPUT
          name: "digital output",
          size: 1,
	  precision: 1
	},
	"2":{ // LPP_ANALOG_INPUT
	  name: "analog input",
	  size: 2,
	  precision: 0.01 // signed
	},
        "3":{ // LPP_ANALOG_OUTPUT
	  name: "analog output",
	  size: 2,
	  precision: 0.01 // signed
	},
	"101":{ // LPP_LUMINOSITY
	  name: "luminosity",
          size: 2,
	  precision: 1 // unit lux unsigned
	},
	"102":{ // LPP_PRESENCE
          name: "presence",
	  size: 1,
	  precision: 1
	},
        "103":{ // LPP_TEMPERATURE
	  name: "temperature",
	  size: 2,
	  precision: 0.1 // unit deg C signed 
	},
	"104":{ // LPP_RELATIVE_HUMIDITY
          name: "humidity",
          size: 1,
	  precision: 0.5 // unit % unsigned
	},
	"113":{ // LPP_ACCELEROMETER
	  name: "accelerometer",
	  size: 6, 
	  precision: 0.001 // unit G
	},
        "115":{ // LPP_BAROMETRIC_PRESSURE
	  name: "pressure",
	  size: 2, 
	  precision: 0.1 //unit hPa
	},
	"134":{ // LPP_GYROMETER
	  name: "gyro",
          size: 6, 
	  precision: 0.01 //unit deg/s
	},
	"136":{ // LPP_GPS
	  name: "GPS",
	  size: 9,
	  precision: [0.0001, 0.01]
	},
	"137":{	// custom PM25 dust sensor
	  name: "PM25 Dust Sensor",
	  size: 2,
          precision: 1
	}
}

var config = {
	"GPS": {
		icon: 'fa-map-marker',
	},
	"temperature": {
		icon: 'fa-thermometer-2',
		pipe: 'celsiusFormat',
	},
	"PM25 Dust Sensor":{
                pipe: 'pm25Format'
	}
}

var cayenne = function(data) {
     var bytes = hexToBytes(data);
     var payload = {};
     for(var i = 0; i < bytes.length; ){

	// read the channel
        var ch = bytes[i++];

	// read the data type
	var type = bytes[i++];
	var obj = cayennePayloadStruct[type];

	// read the data according to size and decode
	switch(type){
		
		case 103:
			var value = (bytes[i] << 8 | bytes[i+1]) / 10;
			payload[obj.name] = value.toFixed(1);
			break;
		case 136:
			var value = {};
			value.lat = (bytes[i] << 16 | bytes[i+1] << 8 | bytes[i+2]) / 10000;
                        value.lng = (bytes[i+3] << 16 | bytes[i+4] << 8 | bytes[i+5]) / 10000;
			value.alt = (bytes[i+6] << 16 | bytes[i+7] << 8 | bytes[i+8]) / 100;
			payload[obj.name] = value;
			break;
		case 137:
			payload[obj.name] = bytes[i] << 8 | bytes[i+1];
			break;	

		// todo - add more sensors

	}
	
	i = i + obj.size;
     }
     
     return payload;
}

var hexToBytes = function(hex) {
     for (var bytes = [], c = 0; c < hex.length; c += 2)
          bytes.push(parseInt(hex.substr(c, 2), 16));
     return bytes;
}
