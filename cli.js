#!/usr/bin/env node
'use strict'
const path = require('path')
const push = require('./src/nodejs/push')
const linker = require('./src/nodejs/linker')
const storage = require('./src/nodejs/storage.js')
const { execSync } = require('child_process')
const printify = require('@ipld/printify')
const registry = require('./src/nodejs/registry')

const pushOptions = yargs => {
}
const runStage = async argv => {
  const store = storage.local()
  const pkg = await push(argv.filename, store.put)
  const cid = await pkg.block().cid()
  console.log(`Staged "@reg/${cid.toString()}"`)
}

const runPublish = async argv => {
  const store = storage.store()
  const pkg = await push(argv.filename, store.put)
  const cid = (await pkg.block().cid()).toString()
  console.log(`Published "@reg/${cid}"`)
  const _registry = registry()
  const res = await _registry.alias(argv.name, cid, argv.semver, argv.latest)
  console.log(`Aliased ${argv.name + '/' + argv.version}`)
  if (res.info.latest) {
    console.log(`Aliased ${argv.name}`)
  }
}

const runCat = async argv => {
}

const bin = path.join(__dirname, 'reg.sh')

const runScript = argv => {
  return execSync(`${bin} ${argv.filename}`, { stdio: 'inherit' })
}
const runLinker = async argv => {
  for await (let { root, block } of linker(argv.filename)) {
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

const runInfo = async argv => {
  const _registry = registry()
  const pkg = await _registry.pkg(argv.name)
  console.log(pkg)
}

const inputOptions = yargs => {
  yargs.positional('filename', {
    desc: 'Filename of script to run. Example `reg myFile.js`'
  })
}

const publishOptions = yargs => {
  inputOptions(yargs)
  yargs.positional('semver', {
    describe: 'Package version number.',
    type: 'string',
    default: 'minor'
  })
}

const yargs = require('yargs')
const args = yargs
  .command('$0 <filename>', 'Run a local script file in reg', inputOptions, runScript)
  .command('publish <filename> <name> <semver>',
           'Publish a module to the registry', publishOptions, runPublish)
  .command('stage <filename>', 'Push a module to the registry', inputOptions, runStage)
  .command('linker <filename>', 'Run the static linker', inputOptions, runLinker)
  .command('pkg-info <name>', 'Get package info for alias', () => {}, runInfo)
  .argv

if (!args._.length && !args.filename) {
  console.log({args})
  yargs.showHelp()
}
