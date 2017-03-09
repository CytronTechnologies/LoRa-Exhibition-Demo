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
app.use('/devices', devices);
app.use('/statistics', statistics);

// Add Socket.io clients to the appEUI room
var appId = 'sunwaylorademo';

io.on('connection', function (socket) {
  socket.join(appId);
	console.log('client joined with '+socket.id)
	socket.on('disconnect', function(){
		console.log('client with '+socket.id+' disconnected');
	});
});

//running loriot application

var websocket;

var startWebSocket = function(){
  websocket = new WebSocket(require('./config/loriot').endpoint);
  websocket.onopen = function(evt) {
    onOpen(evt);
    websocket.onclose = function(evt) {
      onClose(evt)
    };
    websocket.onmessage = function(evt) {
      onMessage(evt)
    };
    websocket.onerror = function(evt) {
      onError(evt)
    };
  };
}

function onOpen(evt) {
  console.log('Websocket opened');
}
function onClose(evt) {
  console.log('Websocket disconnected');
  //restart websocket
  setTimeout(startWebSocket, 1000);
}
function onMessage(evt) {
  try {
  console.log(evt.data)
  var dat = JSON.parse(evt.data);
  new DeviceLog(dat).save(function(err) {
    if (err) console.log(err);
  });
  io.to(appId).emit('uplink', dat);
  }
  catch(e){
    console.log("ERROR in onMessage websocket");
    websocket.close();
  }
}
function onError(evt) {
  console.log(evt.data);
  startWebSocket();
}

//start websocket
startWebSocket();
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
