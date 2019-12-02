const localStorage = require('@ipld/unixfsv2/src/local-storage')
const mkdirp = require('mkdirp')
const path = require('path')
const Block = require('@ipld/block')
const bent = require('bent')

const defaultDir = path.join(process.env.HOME, '.reg', 'blocks')

const toString = async block => {
  const cid = block.cid ? block.cid() : block
  return (await cid).toString('base32')
}

const store = (token, dir = defaultDir, host = 'reg.mikeal.workers.dev') => {
  mkdirp.sync(dir)
  const auth = `?GITHUB_TOKEN=${token}`

  const _put = bent('PUT', `https://${host}/@reg/put/`, 'json')
  const _get = bent(`https://${host}/@reg/block/`, 'buffer')

  const registryPut = async block => {
    const res = await _put(await toString(block) + auth, block.encode())
    return res.key
  }
  const registryGet = async cid => {
    const buffer = await _get(await toString(cid))
    return Block(buffer, cid)
  }

  const cache = localStorage(dir)
  const get = async cid => {
    let block = await cache.get(cid)
    if (!block) {
      block = await registryGet(cid)
      if (block) await cache.put(block)
    }
    return block
  }
  const put = async block => {
    const tasks = [cache.put(block), registryPut(block)]
    const result = await Promise.all(tasks)
    return result[1]
  }
  return { get, put, _get, _put }
}

const local = (dir = defaultDir) => {
  mkdirp.sync(dir)
  return localStorage(dir)
}

module.exports = { local, store }
