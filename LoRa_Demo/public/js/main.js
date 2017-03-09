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
     var temperature = (bytes[9] << 8 | bytes[10]) / 100;
     var location = {
          lat: null,
          lng: null
     };
     location.lat = (bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3]) / 1000000;
     location.lng = (bytes[4] << 24 | bytes[5] << 16 | bytes[6] << 8 | bytes[7]) / 1000000;
     /*if(location.lat==0&&location.lng==0){
     location.lat=4.23398;
     location.lng=101.9722963;
     }*/
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
     var socket = io('/');
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
.directive("ngFormCommit", [function(){
    return {
        require:"form",
        link: function($scope, $el, $attr, $form) {
            $form.commit = function() {
                $el[0].submit();
            };
        }
    };
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
     var index = 0;
     socket.on('uplink', function(data) {
          console.log(data);
          if ($scope.identifiers.indexOf(data.EUI) == -1) {
               index++;
               $scope.identifiers.push(String(data.EUI));
               $scope.markers[data.EUI] = {
                    url: '/img/lora' + index + '.png'
               }
          }
          data.convertedData = convertData(data.data);
          if ($scope.places[String(data.EUI)])
               data.place = $scope.places[String(data.EUI)];
          else
               data.place = "Node " + data.EUI;
          $scope.nodes[data.EUI] = data;
          //console.log($scope.nodes)

          //do some disconnected status logic here
          var currentTime = new Date().getTime();
          $scope.identifiers.forEach(function(item) {
               //console.log($scope.nodes[item].EUI, currentTime - $scope.nodes[item].ts)
               $scope.nodes[item].connected = (currentTime - $scope.nodes[item].ts < 60000);
          })
     })

})
