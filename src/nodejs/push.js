const createTypes = require('./types')
const linker = require('./linker')

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
