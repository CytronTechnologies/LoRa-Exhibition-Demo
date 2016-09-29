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

// Add Socket.io clients to the appEUI room
io.on('connection', function (socket) {
  	socket.join(appEUI);
	console.log('client joined with '+socket.id)
	socket.on('disconnect', function(){
		console.log('client with '+socket.id+' disconnected');
	});
});	

// Configuration for The Things Network
// Find your values with "ttnctl applications" or on the Dashboard:
// https://staging.thethingsnetwork.org/applications/
// From your application overview go to "learn how to get data from this app"
var ttn = require('ttn');
var appEUI = '70B3D57ED0000977';
var accessKey = 'ZxrKFW4Cjy2jSZ7erWx6dyOr27F98Bk06W8gPE4KJwI=';

// Start the TTN Client
var client = new ttn.Client('staging.thethingsnetwork.org', appEUI, accessKey);

client.on('connect', function(){
  console.log('[DEBUG]','Connected to ttn network');
});

// Forward uplink to appEUI room in Socket.io
client.on('uplink', function (msg) {
  console.log("[DEBUG]", "Uplink from Device: " + msg.devEUI)
  io.to(appEUI).emit('uplink', msg)
});

// Forward activations to appEUI room in Socket.io
client.on('activation', function (evt) {
  console.log("[DEBUG]", "Activated Device: " + evt.devEUI)
  io.to(appEUI).emit('activation', evt)
});

// Print errors to the console
client.on('error', function (err) {
  console.log("[ERROR]", err)
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
