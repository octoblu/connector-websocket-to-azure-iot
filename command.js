#!/usr/bin/env node
const Connector = require('./src/Connector')
const OctoDash  = require('octodash')
const packageJSON = require('./package.json')

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
    const options = this.octoDash.parseOptions()
    this.connector = new Connector(options)
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
