'use strict'
const tmp = require('tmp')
const path = require('path')
const assert = require('assert')
const { writeFile } = require('fs').promises
const { it } = require('mocha')
const { push, storage } = require('../')
const { execSync } = require('child_process')
const test = it

const full = p => path.join(__dirname, p)

const store = storage.local()

const fixture = async p => {
  const pkg = await push(full('fixture/src/hello-world.js'), store.put)
  return pkg.block().cid()
}

const write = async str => {
  const f = tmp.tmpNameSync() + '.js'
  await writeFile(f, Buffer.from(str))
  return f
}

const bin = path.join(__dirname, '..', 'reg.sh')

const run = script => {
  const ret = execSync(`${bin} ${script}`)
  return ret.toString()
}

test('basic push and import', async () => {
  const pkg = await fixture('src/hello-world.js', store.put)
  const module = `
    import { hello } from '#${ pkg.toString() }'
    console.log(hello)
  `
  const f = await write(module)
  assert.strictEqual(run(f), 'world\n')
})
