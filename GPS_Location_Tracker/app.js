var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');
var test = require('./routes/test');

var app = express();
//added socket io
var server = require('http').Server(app);
var io = require('socket.io')(server);

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

app.use('/', routes);
/*app.get('/', function(req, res, next){
	res.sendFile('/routes/views/main.html', {root: __dirname }); 
});*/
app.use('/test', test);
app.use('/users', users);

// Configuration for The Things Network
// Find your values with "ttnctl applications" or on the Dashboard:
// https://staging.thethingsnetwork.org/applications/
// From your application overview go to "learn how to get data from this app"
var ttn = require('ttn');
var region = 'brazil';
var appId = '70b3d57ed0000977';
var accessKey = 'ttn-account-v2.juzWB_MKZspLI-PeiUAp2wjGteBuqTK75KdW9urJHnY';

// Add Socket.io clients to the appEUI room
io.on('connection', function (socket) {
  	socket.join(appId);
	console.log('client joined with '+socket.id)
	socket.on('disconnect', function(){
		console.log('client with '+socket.id+' disconnected');
	});
});

// Start the TTN Client
var client = new ttn.Client(region, appId, accessKey);

client.on('connect', function(){
  console.log('[DEBUG]','Connected to ttn network');
});

// Forward uplink to appEUI room in Socket.io
client.on('message', function (deviceId, data) {
  console.log("[DEBUG]", "Message from Device: " + deviceId)
  data.devEUI = deviceId
  io.to(appId).emit('uplink', data)
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

//todo: add more devices

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

//module.exports = app;
module.exports = {app: app, server: server};
