# ttn

This is the node client for The Things Network.
You can use this to get events and messages from your The Things
Network applications.

## Installation

```
npm install --save ttn
```

## Usage

Set up the client and start listening to events:

```js
var ttn = require('ttn');

var appEUI = '70E3DD5EB00001DA';
var accessKey = 'Wy4BJkrOERq8Sm1UgNIR7zdK/DjfuEHZ3n3VM3NnUa0=';
var client = new ttn.Client('staging.thethingsnetwork.org', appEUI, accessKey);

client.on('message', function (msg) {
  // These are messages sent by devices on The Things Network
  // msg = {
  //  devEUI: '00000000973572D0',
  //   fields: { /* ... */ },
  //   counter: 44,
  //   metadata: { /* ... */ },
  // }
});

client.on('activation', function (evt) {
  // These are devices that are activated on The Things Network
  // evt = {
  //  devEUI: '00000000973572D0',
  // }
});

client.on('error', function (err) {
  // todo: handle error
});

// close the client:
client.close()
```


## API

### `Client(<broker>, <appEUI>, <accessKey>)`

Creates a new client that listens to events for your application.

Arguments:
- `broker` (`String`): the TTN MQTT host.
- `appEUI` (`string`): the application EUI for your application.
- `accessKey` (`string`): the application Access Key.

