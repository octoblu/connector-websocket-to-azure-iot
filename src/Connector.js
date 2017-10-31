const debug = require('debug')('connector-websocket-to-azure-iot:Connector')
const DeviceClient = require('azure-iot-device-amqp').AmqpWs
const device = require('azure-iot-device')
const Message = require('azure-iot-device').Message
const bindAll = require('lodash/fp/bindAll')
const getOr = require('lodash/fp/getOr')
const WebSocket = require('ws')
const _ = require('lodash')

const clientFromConnectionString = function (connectionString) {
  return device.Client.fromConnectionString(connectionString, DeviceClient);
}

class Connector {
  constructor({ azureIotDeviceConnectionString, webSocketUrl }) {
    bindAll(Object.getOwnPropertyNames(Connector.prototype), this)

    const client = clientFromConnectionString(azureIotDeviceConnectionString)
    if (!client) throw new Error('Missing required parameter: client')
    this.client = client
    this.client.on('message', this._onAzureMessage)

    if (!webSocketUrl) throw new Error('Missing required parameter: webSocketUrl')
    this.webSocketUrl = webSocketUrl
  }

  run(callback=_.noop) {
    debug('run')
    this.client.open((error) => {
      debug('connected!')
      if (error) return callback(error)
      this._wsConnect()
      return callback()
    })
  }

  _onWebSocketMessage(message) {
    try {
      debug('onWebSocketMessage', JSON.stringify(message,null,2))
      this.client.sendEvent(new Message(message))
    } catch(error) {
      console.error( `Error sending a message from device websocket: ${error.message}`)
      return
    }
  }

  _onAzureMessage(azureMessage) {
    this.client.complete(azureMessage)
    const message = azureMessage.data
    debug('onAzureMessage', JSON.stringify(message,null,2))
    if (!this.ws) return
    this.ws.send(JSON.stringify(message))
  }

  _wsConnect() {
    this.ws = new WebSocket(this.webSocketUrl)
    const waitAndConnectOnce = _.once(this._waitAndConnect)
    this.ws.on('message', this._onWebSocketMessage)
    this.ws.on('error', waitAndConnectOnce)
    this.ws.on('close', waitAndConnectOnce)
  }

  _waitAndConnect(error){
    this.ws = null
    debug('waitAndConnect', error)
    if(this.timeoutHandle) {
      clearTimeout(this.timeoutHandle)
    }
    this.timeoutHandle = setTimeout(this.run, 1000)
  }

}

module.exports = Connector
