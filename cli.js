#!/usr/bin/env node
'use strict'
const path = require('path')
const push = require('./src/nodejs/push')
const linker = require('./src/nodejs/linker')
const storage = require('./src/nodejs/storage.js')
const { execSync } = require('child_process')
const printify = require('@ipld/printify')
const store = storage.local()

const pushOptions = yargs => {
}
const runPush = async argv => {
  const pkg = await push(argv.input, store.put)
  const cid = await pkg.block().cid()
  console.log(`Published "/@reg/${cid.toString()}"`)
}

const bin = path.join(__dirname, 'reg.sh')

const runScript = argv => {
  const str = execSync(`${bin} ${argv.input}`)
  stdout.write(str)
  return str
}
const runLinker = async argv => {
  for await (let { root, block } of linker(argv.input)) {
    if (root) {
      block = root.block()
    }
    if (block.codec === 'raw') {
      console.log('Block<raw>', (await block.cid()).toString())
    } else {
      console.log('Block<' + block.codec + '>', printify(block.decode()))
    }
  }
}

const yargs = require('yargs')
const args = yargs
  .command('push <input> [name]', 'Push a module to the registry', pushOptions, runPush)
  .command('run <input>', 'Run a script in reg', () => {}, runScript)
  .command('linker <input>', 'Run the static linker', () => {}, runLinker)
  .argv

if (!args._.length) {
  yargs.showHelp()
}
