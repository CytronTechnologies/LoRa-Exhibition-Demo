function base64Decode(data){
	if (typeof Buffer.from === "function") {
	    // Node 5.10+
	    return Buffer.from(data, 'base64'); // Ta-da
	} else {
	    // older Node versions
	    return new Buffer(data, 'base64'); // Ta-da
	}
}

//Convert byte Array to hex string
function toHexString(byteArray) {
  return byteArray.map(function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('')
}

// conversion function
var conversion = function(data){

        var bytes = base64Decode(data);
	var message = {};

	//Conversion starts here
	//You can start doing conversion and return converted data as message
        var lat = (bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3])/10E5;
        message.Lat = lat;
        var lng = (bytes[4] << 24 | bytes[5] << 16 | bytes[6] << 8 | bytes[7])/10E5;
        message.Lng = lng;

	return message;
}


module.exports = {
	convert: conversion	
}
