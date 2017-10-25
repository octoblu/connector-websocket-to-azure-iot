#!/usr/bin/env node
const OctoDash  = require('octodash')
const packageJSON = require('./package.json')
const DeviceClient = require('azure-iot-device-amqp').AmqpWs
const device = require('azure-iot-device')
const Message = require('azure-iot-device').Message

const clientFromConnectionString = function (connectionString) {
  return device.Client.fromConnectionString(connectionString, DeviceClient);
}

const CLI_OPTIONS = [
  {
    names: ['azure-iot-device-connection-string','a'],
    type: 'string',
    required: true,
    env: 'AZURE_IOT_DEVICE_CONNECTION_STRING',
    help: 'The hostname for Azure IOT',
    helpArg: 'string',
  },
]
class Command {
  constructor({argv, cliOptions = CLI_OPTIONS} = {}) {
    this.octoDash = new OctoDash({
      argv,
      cliOptions,
      name: packageJSON.name,
      version: packageJSON.version,
    })
    const {
      azureIotDeviceConnectionString,
    } = this.octoDash.parseOptions()

    this.client = clientFromConnectionString(azureIotDeviceConnectionString)
    this.client.on('message', this.handleMessage.bind(this))
    this.client.open()

    setInterval(()=>{
      console.log('ping...')
      this.client.sendEvent(new Message(JSON.stringify({ping:Date.now()})))
    }, 10000)
  }

  handleMessage(msg) {
    this.client.complete(msg)
    var message = msg.data.toString()
    try {
      message = JSON.parse(msg.data)
    } catch(e) {}
    console.log('received:', JSON.stringify(message,null,2))
  }
}

if (require.main === module) {
  const command = new Command({ argv: process.argv })
  // command.run()
}

module.exports = Command
