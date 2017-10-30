const debug = require('debug')('connector-websocket-to-azure-iot:Connector')
const Message = require('azure-iot-device').Message
const bindAll = require('lodash/fp/bindAll')
const getOr = require('lodash/fp/getOr')
const WebSocket = require('ws')
const _ = require('lodash')

class Connector {
  constructor({ client, webSocketUrl }) {
    bindAll(Object.getOwnPropertyNames(Connector.prototype), this)

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
      debug('message', message)
      this.client.sendEvent(new Message(message))
    } catch(error) {
      console.error( `Error receiving a message from the powermate: ${error.message}`)
      return
    }
  }

  _onAzureMessage(message) {
    this.client.complete(message)
    message = message.data
    debug('onMessage', JSON.stringify({data:message},null,2))
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
