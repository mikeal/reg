#!/usr/bin/env node
'use strict'

/* hack - fixes bug in multicodec table */
const path = require('path')
const table = require('multicodec/src/name-table')
const modpath = path.join(__dirname, 'node_modules/multicodec/src/name-table.js')
require.cache[modpath].exports = { ...table, '0129': 'dag-json' }
/* end hack */

const mkdirp = require('mkdirp')
const push = require('./src/nodejs/push')
const linker = require('./src/nodejs/linker')
const storage = require('./src/nodejs/storage.js')
const deflate = require('./src/nodejs/deflate.js')
const { execSync } = require('child_process')
const printify = require('@ipld/printify')
const registry = require('./src/nodejs/registry')
const CID = require('cids')
const createTypes = require('./src/nodejs/types')
const tmp = require('tmp')

const tmpdir = f => tmp.dirSync(f)

const pushOptions = yargs => {
}
const runStage = async argv => {
  const store = storage.local()
  const pkg = await push(argv.filename, store.put)
  const cid = await pkg.block().cid()
  mkdirp.sync(argv['target-dir'])
  const manifest = await deflate(cid, argv['target-dir'], store)
  console.log(manifest)
  console.log(`Staged "@reg/${cid.toString()}"`)
  manifest.main = cid
  return manifest
}

const runPublish = async argv => {
  const store = storage.store(argv.token)
  const pkg = await push(argv.filename, store.put)
  const cid = (await pkg.block().cid()).toString()
  console.log(`Published "@reg/${cid}"`)
  const _registry = registry(argv.token)
  const res = await _registry.alias(argv.name, cid, argv.semver, argv.latest)
  console.log(`Aliased ${argv.name + '/' + argv.semver}`)
  if (res.info.latest) {
    console.log(`Aliased ${argv.name}`)
  }
}

const runCat = async argv => {
  const _registry = registry()
  const pkg = await _registry.pkg(argv.name)
  const store = storage.store()
  const types = createTypes({ getBlock: store.get })
  const block = await store.get(new CID(pkg.pkg))
  const p = types.Package.decoder(block.decode())
  const data = await p.getNode('*/file/data')
  for await (const chunk of data.read()) {
    process.stdout.write(chunk)
  }
}

const bin = path.join(__dirname, 'reg.sh')

const runScript = async argv => {
  const dir = tmpdir().name
  argv['target-dir'] = dir
  const stage = await runStage(argv)
  const filename = path.join(dir, stage.main.toString('base32') + '.js')
  return execSync(`${bin} ${filename}`, { stdio: 'inherit' })
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

const validate = str => {
  try {
    new CID(str)
  } catch (e) {
    return false
  }
  return true
}

const runPkgInfo = async argv => {
  let cid
  if (!validate(argv.cid)) {
    const _registry = registry()
    const pkg = await _registry.pkg(argv.name)
    cid = new CID(pkg.pkg)
  } else {
    cid = new CID(argv.cid)
  }
  const store = storage.store()
  const block = await store.get(cid)
  console.log(printify(block.decode()))
}

const inputOptions = yargs => {
  yargs.positional('filename', {
    desc: 'Filename of script to run. Example `reg myFile.js`'
  })
}

const stageOptions = yargs => {
  inputOptions(yargs)
  yargs.option('target-dir', {
    desc: 'Directory to deflate all required files',
    default: path.join(process.env.HOME, '.reg', 'deflate')
  })
}

const publishOptions = yargs => {
  inputOptions(yargs)
  yargs.option('token', {
    describe: 'GitHub personal access token',
    type: 'string',
    default: process.env.GHTOKEN || process.env.GITHUB_TOKEN
  })
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
  .command('stage <filename>', 'Run the linker and stage the tree in local cache', stageOptions, runStage)
  .command('linker <filename>', 'Run the static linker', inputOptions, runLinker)
  .command('info <name>', 'Get info for named alias', () => {}, runInfo)
  .command('cat <name>', 'Print the file data for the named alias', () => {}, runCat)
  .command('pkg-info <cid|name>', 'Get package information', () => {}, runPkgInfo)
  .argv

if (!args._.length && !args.filename) {
  yargs.showHelp()
}
