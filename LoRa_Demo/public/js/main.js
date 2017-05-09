var app = angular.module('myApp', ['angularMoment', 'ngMap', 'highcharts-ng','ui.bootstrap']);

var times = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
var start = new Date(2017,1,28).getTime();
var periods = [];
var now = new Date().getTime();
for(var i=start;i<now;i+=3600*24*1000){
     periods.push(i);
}
//console.log(periods);
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

// Custom filters
app.filter("GPSLatFormat", [function(){
    var pipe = function(input){
        //console.log(input);
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

.filter("celsiusFormat",[function(){
    var pipe = function(input){
    	return input.toString().concat(' \xB0C');
    }
    return pipe;
}]) 

.filter("pm25Format",[function(){
    var pipe = function(input){
    	return input.toString().concat(' ug/m\xB3');
    }
    return pipe;
}]) 

app.controller('MainController', function($filter, $window, $scope, $http, $interval, socket, moment) {
     console.log('Get started!');

     // apply filter function
     $scope.applyFilter = function(model, filter) {
	return $filter(filter)(model);
     };

     // update icons for various kinds of sensors
     $scope.config = config;

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
     $scope.connected = 0;
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
     var updateConnectionStatus = function(){
        var numberOfConnections = 0;
	numberOfConnections = $scope.identifiers.reduce(function(prevVal, item) {
    		if($scope.nodes[item.id].connected)
		 return prevVal + 1;
                else
                 return prevVal;
	}, 0);
	$scope.connected = numberOfConnections;
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
          data.convertedData = cayenne(data.data);
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
	       updateConnectionStatus();
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
		updateConnectionStatus();

          }, 20000) 
     }

     test = testConnection();
})
