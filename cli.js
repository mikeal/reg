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
  console.log(`Published "@reg/${cid.toString()}"`)
}

const bin = path.join(__dirname, 'reg.sh')

const runScript = argv => {
  return execSync(`${bin} ${argv.filename}`, { stdio: 'inherit' })
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

const runOptions = yargs => {
  yargs.positional('filename', {
    desc: 'Filename of script to run. Example `reg myFile.js`'
  })
}

const yargs = require('yargs')
const args = yargs
  .command('$0 <filename>', 'Run a local script file in reg', runOptions, runScript)
  .command('push <input> [name]', 'Push a module to the registry', pushOptions, runPush)
  .command('linker <input>', 'Run the static linker', () => {}, runLinker)
  .argv

if (!args._.length && !args.filename) {
  console.log({args})
  yargs.showHelp()
}
