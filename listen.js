#!/usr/bin/env node
const OctoDash  = require('octodash')
const packageJSON = require('./package.json')
const EventHubClient = require('azure-event-hubs').Client

const CLI_OPTIONS = [
  {
    names: ['azure-iot-connection-string'],
    type: 'string',
    required: true,
    env: 'AZURE_IOT_CONNECTION_STRING',
    help: "The hostname for Azure IOT",
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
    const { azureIotConnectionString } = this.octoDash.parseOptions()
    this.client = EventHubClient.fromConnectionString(azureIotConnectionString)
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

  run() {
    const client = this.client
    const self = this
    client.open()
    .then(client.getPartitionIds.bind(client))
    .then(function (partitionIds) {
        return partitionIds.map(function (partitionId) {
            return client.createReceiver('$Default', partitionId, { 'startAfterTime' : Date.now()}).then(function(receiver) {
                console.log('Created partition receiver: ' + partitionId)
                receiver.on('errorReceived', self.panic);
                receiver.on('message', self.printMessage);
            });
        });
    })
    .catch(self.panic)
  }
}

if (require.main === module) {
  const command = new Command({ argv: process.argv })
  command.run()
}

module.exports = Command
