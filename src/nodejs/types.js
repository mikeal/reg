const schema = require('../schema.json')
const gen = require('ipld-schema-gen')
const createTypes = require('../../../js-unixfsv2/src/schema')

const create = (opts={}) => {
  const types = createTypes(opts)
  opts = { ...opts, types }
  return { ...types, ...gen(schema, opts) }
}

module.exports = create
