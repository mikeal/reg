const createTypes = require('./types.js')
const path = require('path')
const types = createTypes({codec: 'dag-json'})
const CID = require('cids')
const makeRegistry = require('./registry')

/*
Registry layout is simple. Every user has their own namespace
and can publish a package to that name.

/:github-username/:package-name

The registry is simply an authenticated k/v store that points
these namespaces to CIDs.

/@mikeal/bent => CID

The CID must be a valid Package.
*/

const { parse, print } = require('recast')
const { readFile } = require('fs').promises

// TODO: replace with better API on unixfs File, File.fromString
const fileIter = async function * (str) { yield Buffer.from(str) }

const importer = async function * (parser) {
  const registry = makeRegistry()
  let ast = await parser.parsed
  const pending = []
  const isLocal = s => {
    if (s.startsWith('./')) return true
    if (s.startsWith('../')) return true
    return false
  }
  const deps = {}
  const _parse = async function * (i) {
    const dec = ast.program.body[i]
    const source = dec.source.value
    let cid
    if (source.startsWith('@reg/')) {
      // For some reason, this is already hash linked.
      deps[source] = new CID(source.slice('@reg/'.length))
      return
    } else if (source.startsWith('@')) {
      /* reserve @std/ for browser standard library */
      if (source.startsWith('@std/')) return
      const info = await registry.pkg(source)
      console.log({info})
      if (!info) throw new Error(`No package in registry named ${source}`)
      cid = new CID(info.pkg)
    } else if (isLocal(source)) {
      for await (let { root, block } of parser.resolve(source)) {
        if (root) {
          block = root.block()
          cid = await block.cid()
        }
        yield { block }
      }
    } else {
      throw new Error(`Unknown import "${ source }"`)
    }
    deps[source] = cid
    dec.source.value = `@reg/${cid.toString()}`
    let str = print(dec).code
    str += ` // static-link("${source}")`
    ast.program.body[i] = parse(str).program.body[0]
  }
  let i = 0
  for (const dec of [...ast.program.body]) {
    if (dec.type === 'ImportDeclaration') {
      yield * _parse(i)
    }
    i++
  }
  const code = print(ast).code

  let fileLink
  const iter = types.File.fromIter(fileIter(code), 'test')
  for await (let { block, root } of iter) {
    if (root) {
      block = root.block()
      fileLink = await block.cid()
    }
    yield { block }
  }
  const pkg = types.Package.encoder({ v1: { file: await fileLink, deps }})
  const block = pkg.block()
  yield { root: pkg }
}


class Parser {
  constructor (file) {
    this.file = file
    this.parsed = this.parse()
  }
  async parse () {
    const buffer = await readFile(this.file)
    return parse(buffer.toString())
  }
  imports () {
    return importer(this)
  }
  resolve (local) {
    const f = path.resolve(path.dirname(this.file), local)
    const parser = new Parser(f)
    return parser.imports()
  }
}

const linker = async function * (file) {
  const parser = new Parser(file)
  yield * parser.imports()
}

module.exports = linker

/*
const push = async (file, putBlock) => {
  for await (let { block, root } of linker(file)) {
    // noop
  }
  return
  const puts = []
  const files = {}
  // TODO: parse file and re-write all imports to
  // CID references.
  
  }
module.exports = push
*/
