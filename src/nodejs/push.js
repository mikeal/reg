const createTypes = require('./types')
const linker = require('./linker')

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
  let pkg
  for await (let { block, root } of linker(file)) {
    if (root) {
      block = root.block()
      pkg = root
    }
    puts.push(putBlock(block))
  }
  await Promise.all(puts)
  return pkg
}
module.exports = push
