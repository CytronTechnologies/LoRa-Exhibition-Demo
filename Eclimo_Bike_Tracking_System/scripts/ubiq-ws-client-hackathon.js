// Example web server application
// Change conf.userid and conf.password respectively
// devEUI is the name for the socket channel, can be any string, you can simply use your device EUI

var WebSocket = require("ws");

var conf = {
    host: "guestnet-malaysia.orbiwise.com",
    port: null,
    userid: "eclimo",
    password: "eclimo123"
};

var url = "wss://" + conf.host + (conf.port != null ? ":" + conf.port : "") + "/websocket/connect";
console.log(url);

var ws = new WebSocket(url, {
    headers: {
        Authorization: "Basic " + new Buffer(conf.userid + ":" + conf.password).toString("base64")
    }
});

ws.on('open', function () {
    console.log("WEB-SOCKET: OPEN");
});

ws.on('error', function (err) {
    console.log("WEB-SOCKET: ERROR");
    console.log(err);
});

module.exports = ws;
