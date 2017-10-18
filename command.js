#!/usr/bin/env node
const Connector = require('./src/Connector')
const OctoDash  = require('octodash')
const packageJSON = require('./package.json')
const DeviceClient = require('azure-iot-device-amqp').AmqpWs
const device = require('azure-iot-device')

const clientFromConnectionString = function (connectionString) {
  return device.Client.fromConnectionString(connectionString, DeviceClient);
}

const CLI_OPTIONS = [
  {
    names: ['web-socket-url'],
    type: 'string',
    required: true,
    env: 'WEB_SOCKET_URL',
    help: "The URL to the websocket",
    helpArg: 'URL',
    default: 'http://localhost:52052',
  },
  {
    names: ['azure-iot-hostname'],
    type: 'string',
    required: true,
    env: 'AZURE_IOT_HOSTNAME',
    help: "The hostname for Azure IOT",
    helpArg: 'HOSTNAME',
  },
  {
    names: ['azure-iot-device-id'],
    type: 'string',
    required: true,
    env: 'AZURE_IOT_DEVICE_ID',
    help: "The device id for Azure IOT",
    helpArg: 'DEVICEID',
  },
  {
    names: ['azure-iot-device-key'],
    type: 'string',
    required: true,
    env: 'AZURE_IOT_DEVICE_KEY',
    help: "The device key for Azure IOT",
    helpArg: 'DEVICEKEY',
  },]
class Command {
  constructor({argv, cliOptions = CLI_OPTIONS} = {}) {
    this.octoDash = new OctoDash({
      argv,
      cliOptions,
      name: packageJSON.name,
      version: packageJSON.version,
    })
    const {
      webSocketUrl,
      azureIotHostname,
      azureIotDeviceId,
      azureIotDeviceKey,
    } = this.octoDash.parseOptions()
    const connectString = `HostName=${azureIotHostname};DeviceId=${azureIotDeviceId};SharedAccessKey=${azureIotDeviceKey}`
    const client = clientFromConnectionString(connectString)
    this.connector = new Connector({ client, webSocketUrl })
  }

  panic(error) {
    console.error(error.stack) // eslint-disable-line no-console
    process.exit(1)
  }

  panicIfError(error) {
    if (!error) return
    this.panic(error)
  }

  run() {
    this.connector.run((error) => {
      if (error) this.panic(error)
    })
  }
}

if (require.main === module) {
  const command = new Command({ argv: process.argv })
  command.run()
}

module.exports = Command
