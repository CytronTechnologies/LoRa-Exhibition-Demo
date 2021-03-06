var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');

var deveui = '0004a30b001ba535';
var ws = require('./scripts/ubiq-ws-client-hackathon.js');
var convert = require("./scripts/convert");

ws.on('message', function (data, flags) {

    try {
		data = JSON.parse(data);
		console.log("Received data on websocket");
		console.log(data);
	
		if(data.payloads_ul.dataFrame && data.payloads_ul.deveui === deveui){
			var converted = convert.convert(data.payloads_ul.dataFrame);
			console.log(converted);
			data.payload = converted;
			io.to('eclimo').emit('uplink', data);
		}
	
    } catch (e) {
        console.log("ERROR in websocket push data - can't parse JSON");
    }

});

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

// Add Socket.io clients to the appEUI room
io.on('connection', function (socket) {
  	socket.join('eclimo');
	console.log('client joined with '+socket.id)
	socket.on('disconnect', function(){
		console.log('client with '+socket.id+' disconnected');
	});
});

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


module.exports = {app: app, server: server};
