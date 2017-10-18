#!/usr/bin/env node
const OctoDash  = require('octodash')
const packageJSON = require('./package.json')
const Client = require('azure-iothub').Client
const Message = require('azure-iot-common').Message

const CLI_OPTIONS = [
  {
    names: ['azure-iot-connection-string'],
    type: 'string',
    required: true,
    env: 'AZURE_IOT_CONNECTION_STRING',
    help: "The hostname for Azure IOT",
    helpArg: 'string',
  },
  {
    names: ['target'],
    type: 'string',
    required: true,
    env: 'TARGET',
    help: "The target for Azure IOT",
    helpArg: 'TARGET',
  },
  {
    names: ['message'],
    type: 'string',
    required: true,
    env: 'MESSAGE',
    help: "The message for Azure IOT",
    helpArg: 'MESSAGE',
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
    const { azureIotConnectionString, target, message } = this.octoDash.parseOptions()
    this.target = target
    this.message = message
    this.client = Client.fromConnectionString(azureIotConnectionString)
  }

  panic(error) {
    console.error(error.stack) // eslint-disable-line no-console
    process.exit(1)
  }

  panicIfError(error) {
    if (!error) return
    this.panic(error)
  }

  printMessage(message) {
    console.log('Message received: ')
    console.log(JSON.stringify(message.body))
    console.log('')
  }

  printResultFor(op) {
    return function printResult(err, res) {
      if (err) console.log(op + ' error: ' + err.toString())
      if (res) console.log(op + ' status: ' + res.constructor.name)
    }
  }

  receiveFeedback(err, receiver) {
    receiver.on('message', function (msg) {
      console.log('Feedback message:')
      console.log(msg.getData().toString('utf-8'));
    });
  }

  run() {
    const client = this.client
    const self = this
    console.log('running...')
    client.open((err) => {
      console.log('client opened!', err)
      client.getFeedbackReceiver(self.receiveFeedback)
      var message = new Message(self.message)
      message.ack = 'full';
      message.messageId = Date.now()
      client.send(self.target, message, self.printResultFor("sent"))
    })
  }
}

if (require.main === module) {
  const command = new Command({ argv: process.argv })
  command.run()
}

module.exports = Command
