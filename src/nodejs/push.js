const createTypes = require('./types')
const { encoder } = require('../../../js-unixfsv2')

/*
Registry layout is simple. Every user has their own namespace
and can publish a package to that name.

/:github-username/:package-name

The registry is simply an authenticated k/v store that points
these namespaces to CIDs.

/@mikeal/bent => CID

The CID must be a valid Package.
*/

const push = async (file, putBlock) => {
  const types = createTypes({codec: 'dag-json'})
  const puts = []
  const files = {}
  // TODO: parse file and re-write all imports to
  // CID references.
  let fileLink
  for await (let { block, root } of encoder(file)) {
    if (root) {
      block = root.block()
      fileLink = await block.cid()
    }
    puts.push(putBlock(block))
  }
  const pkg = types.Package.encoder({ file: await fileLink, deps: {} })
  const block = pkg.block()
  puts.push(putBlock(block))
  await Promise.all(puts)
  return pkg
}
module.exports = push
