var app = angular.module('myApp', ['angularMoment', 'ngMap', 'highcharts-ng','ui.bootstrap']);

var times = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
var start = new Date(2017,1,28).getTime();
var periods = [];
var now = new Date().getTime();
for(var i=start;i<now;i+=3600*24*1000){
     periods.push(i);
}
//console.log(periods);
var convertData = function(data) {
     var bytes = hexToBytes(data);
     var temperature = (bytes[2] << 8 | bytes[3]) / 10;
     var location = {
          lat: null,
          lng: null,
          alt: null,
     };
     if(bytes.length > 4){
     	location.lat = (bytes[6] << 16 | bytes[7] << 8 | bytes[8]) / 10000;
     	location.lng = (bytes[9] << 16 | bytes[10] << 8 | bytes[11]) / 10000;
        location.alt = (bytes[12] << 16 | bytes[13] << 8 | bytes[14]) /10000;
     }
     return {
          temperature: temperature,
          location: location
     }
}
var hexToBytes = function(hex) {
     for (var bytes = [], c = 0; c < hex.length; c += 2)
          bytes.push(parseInt(hex.substr(c, 2), 16));
     return bytes;
}
app.factory('socket', function($rootScope) {
     var socket = io('/', {path: "/lorademo/socket.io/"});
     return {
          on: function(eventName, callback) {
               socket.on(eventName, function() {
                    var args = arguments;
                    $rootScope.$apply(function() {
                         callback.apply(socket, args);
                    });
               });
          },
          emit: function(eventName, data, callback) {
               socket.emit(eventName, data, function() {
                    var args = arguments;
                    $rootScope.$apply(function() {
                         if (callback) {
                              callback.apply(socket, args);
                         }
                    });
               })
          }
     };
})
.filter("GPSLatFormat", [function(){
    var pipe = function(input){
        console.log(input);
     	var decimal1 = Math.floor(input);
    	var decimal2 = Math.floor((input - decimal1)*60);
    	var decimal3 = Math.round(((input - decimal1)*60 - decimal2)*60);
    	var dir = input>=0? 'N':'S';
    	return (decimal1.toString() + '\xBA ' + decimal2.toString() + '\' ' + decimal3.toString() + '\'\' ' + dir);
    }
    return pipe;
}])

.filter("GPSLngFormat", [function(){
    var pipe = function(input){
    	var decimal1 = Math.floor(input);
    	var decimal2 = Math.floor((input - decimal1)*60);
    	var decimal3 = Math.round(((input - decimal1)*60 - decimal2)*60);
    	var dir = input>=0? 'E':'W';
    	return (decimal1.toString() + '\xBA ' + decimal2.toString() + '\' ' + decimal3.toString() + '\'\' ' + dir);
    }
    return pipe;
}])

app.controller('MainController', function($window, $scope, $http, $interval, socket, moment) {
     console.log('Get started!');
     $scope.places = [];
     $http.get("place.json").then(function(response) {
          //console.log(response.data.result);
          var array = response.data.result;
          array.forEach(function(item) {
                    $scope.places[item.id] = item.name;
               })
               //console.log($scope.places)
     });
     $scope.identifiers = [];
     $scope.nodes = [];
     $scope.markers = [];
     $scope.connected = [];
     var test;
     var index = 0;
     var checkDataEUI = function(array, EUI){
     	var isTrue = false;
        array.forEach(function(item){
		if(item.id == EUI)
			isTrue = true;
	});
	return isTrue;
     }
     socket.on('uplink', function(data) {
          console.log(data);
          if (!checkDataEUI($scope.identifiers, data.EUI)) {
               index++;
               $scope.identifiers.push({id:String(data.EUI),name:$scope.places[String(data.EUI)]});
               $scope.markers[data.EUI] = {
                    url: 'img/lora' + index + '.png'
               }
          }
          data.convertedData = convertData(data.data);
          if ($scope.places[String(data.EUI)])
               data.place = $scope.places[String(data.EUI)];
          else
               data.place = "Node " + data.EUI;
          $scope.nodes[data.EUI] = data;
          //console.log($scope.nodes)

          stopTest();

          //do some disconnected status logic here
          var currentTime = new Date().getTime();
          $scope.identifiers.forEach(function(item) {
               //console.log($scope.nodes[item].EUI, currentTime - $scope.nodes[item].ts)
               $scope.nodes[item.id].connected = (currentTime - $scope.nodes[item.id].ts < 60000);
          })

          testConnection();
     })

     var stopTest = function(){
     	  if (angular.isDefined(test)) {
            $interval.cancel(test);
            test = undefined;
          }
     }

     var testConnection = function(){
          $interval(function(){
		var currentTime = new Date().getTime();
         	$scope.identifiers.forEach(function(item) {
               		//console.log($scope.nodes[item].EUI, currentTime - $scope.nodes[item].ts)
               		$scope.nodes[item.id].connected = (currentTime - $scope.nodes[item.id].ts < 60000);
          	})

          }, 20000) 
     }

     test = testConnection();
})
