const localStorage = require('../../../js-unixfsv2/src/local-storage')
const mkdirp = require('mkdirp')
const path = require('path')

const defaultDir = path.join(process.env.HOME, '.reg', 'blocks')

const local = dir => {
  if (!dir) dir = defaultDir
  mkdirp.sync(dir)
  return localStorage(dir)
}

module.exports = { local }
