#!/usr/bin/env node
'use strict'
const push = require('./src/nodejs/push')
const storage = require('./src/nodejs/storage.js')
const store = storage.local()

const pushOptions = yargs => {
}
const runPush = async argv => {
  const pkg = await push(argv.input, store.put)
  const cid = await pkg.block().cid()
  console.log(`Published "@reg/${cid.toString()}"`)
}

const yargs = require('yargs')
const args = yargs
  .command('push <input> [name]', 'Push a module to the registry', pushOptions, runPush)
  .argv

if (!args._.length) {
  yargs.showHelp()
}
