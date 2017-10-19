const Device = require('azure-iot-device')
const Client = require("azure-iot-device-mqtt").MqttWs
const Message = Device.Message;

const clientFromConnectionString = function (connectionString) {
  return Device.Client.fromConnectionString(connectionString, Client);
}

const connectionString = '...'

const client = clientFromConnectionString(connectionString);

const handleMessage = function (msg) {
    client.complete(msg)
    var message = msg.data.toString()
    try {
      message = JSON.parse(msg.data)
    } catch(e) {}
    console.log(JSON.stringify(message,null,2))
}

client.on('message',handleMessage)

client.open(function(err) {
  if (err) {
    console.error('Could not connect: ' + err);
    return
  }
  client.sendEvent(new Message('hello from the browser'))
})

console.log('connectionString:', connectionString)
