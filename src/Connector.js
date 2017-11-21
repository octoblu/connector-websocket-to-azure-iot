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
    this.client.on('error', (error) => { console.error(error.stack); process.exit(1) })
    this.client.on('disconnect', () => { process.exit(0) })

    if (!webSocketUrl) throw new Error('Missing required parameter: webSocketUrl')
    this.webSocketUrl = webSocketUrl
  }

  run(callback=_.noop) {
    debug('run')
    this._wsConnect()
    this.client.open()
    return callback()
  }

  _azureWaitAndConnect(error){
    debug('azureWaitAndConnect', error)
    if(this.azureTimeoutHandle) {
      clearTimeout(this.azureTimeoutHandle)
    }
    this.azureTimeoutHandle = setTimeout(()=> {
      this.client.open((error)=>{
        console.error('client open error:', error)
      })
    }, 1000)
  }

  _onWebSocketMessage(message) {
    try {
      debug('onWebSocketMessage', JSON.stringify(message,null,2))
      const azureMessage = new Message(message)
      azureMessage.expiryTimeUtc = Date.now() + 20000
      this.client.sendEvent(azureMessage, (error) => {
        if (error) console.error('send event error:', error)
      })
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
    const wsWaitAndConnectOnce = _.once(this._wsWaitAndConnect)
    this.ws.on('message', this._onWebSocketMessage)
    this.ws.on('error', wsWaitAndConnectOnce)
    this.ws.on('close', wsWaitAndConnectOnce)
  }

  _wsWaitAndConnect(error){
    this.ws = null
    debug('waitAndConnect', error)
    if(this.wsTimeoutHandle) {
      clearTimeout(this.wsTimeoutHandle)
    }
    this.wsTimeoutHandle = setTimeout(this._wsConnect, 1000)
  }

}

module.exports = Connector
