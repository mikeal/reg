'use strict'
const path = require('path')
const createTypes = require('./types')
const fs = require('fs')
const { stat } = fs.promises
const { once } = require('events')

const _write = async (stream, chunk) => {
  if (!stream.write(chunk)) await once(stream, 'drain')
}

const exists = async filename => {
  try {
    return fs.stat(filename)
  } catch (e) {
    return false
  }
}

const write = async (filename, pkg, dir) => {
  if (await exists(filename)) {
    return
  }
  const data = await pkg.getNode('*/file/data')
  const f = fs.createWriteStream(filename)
  for await (const chunk of data.read()) {
    await _write(f, chunk)
  }
  const finish = once(f, 'finish')
  f.end()
  await finish
}

const getDeps = async (pkg, dir, store, name, obj) => {
  const deps = await pkg.get('*/deps')
  const promises = []
  for (let [key, link] of Object.entries(deps)) {
    let _name = name
    if (key.startsWith('@')) {
      _name = key
    } else {
      _name += '/' + key
    }
    promises.push(deflate(link, dir, store, _name, obj))
  }
  return Promise.all(promises)
}

const deflate = async (cid, dir, store, name='', obj={}) => {
  const key = cid.toString('base32')
  if (!obj[key]) obj[key] = []
  obj[key].push(name ? name : 'main')
  const filename = path.join(dir, cid.toString('base32') + '.js')
  const types = createTypes({getBlock: store.get})
  const block = await store.get(cid)
  const pkg = types.Package.decoder(block.decode())
  await Promise.all([write(filename, pkg, dir), getDeps(pkg, dir, store, name, obj)])
  return obj
}

module.exports = deflate
