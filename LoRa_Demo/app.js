var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var WebSocket = require("ws");
var index = require('./routes/index');
var devices = require('./routes/devices');
var statistics = require('./routes/statistics');
var app = express();

//added socket io
var server = require('http').Server(app);
var io = require('socket.io')(server);

//connect to database
var config = require('./config/database');
var mongoose = require('mongoose');
mongoose.connect(config.database);
var DeviceLog = require('./app/models/deviceLog');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
//app.use('/devices', devices);
//app.use('/statistics', statistics);

// Add Socket.io clients to the room
var room = 'lorademo';

io.on('connection', function (socket) {
  socket.join(room);
	console.log('client joined with '+socket.id)
	socket.on('disconnect', function(){
		console.log('client with '+socket.id+' disconnected');
	});
});

// Running The Things Network application
// Configuration for The Things Network
// Find your values with "ttnctl applications" or on the Dashboard:
// https://console.thethingsnetwork.org/applications/

var ttn = require('ttn');
var region = 'brazil';
var appId = '70b3d57ed0000977';
var accessKey = 'ttn-account-v2.juzWB_MKZspLI-PeiUAp2wjGteBuqTK75KdW9urJHnY';

// Start the TTN Client
var client = new ttn.Client(region, appId, accessKey);

client.on('connect', function(){
  console.log('[DEBUG]','Connected to ttn network');
});

// Forward uplink to appEUI room in Socket.io
client.on('message', function (deviceId, data) {
  console.log("[DEBUG]", "Message from Device: " + deviceId)
  //data.devEUI = deviceId
  var dat = {
  	fcnt: data.counter,
	EUI: data.hardware_serial,
	ts: new Date(data.metadata.time).getTime(),
	data: data.payload_fields.payload,
	port: data.port
  }
  io.to(room).emit('uplink', dat)
});

// Forward activations to appEUI room in Socket.io
client.on('activation', function(deviceId, data) {
    console.log('[INFO] ', 'Activation:', deviceId, data);
});

// Print errors to the console
client.on('error', function (err) {
  console.log("[ERROR]", err.message)
});

// Close the TTN client on exit
process.on('exit', function(code) {
  client.end()
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//module.exports = app;
module.exports = {app: app, server: server};
