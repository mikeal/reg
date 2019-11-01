import path from 'path'
import process from 'process'
import Module from 'module'
import fs from 'fs'
import { promisify } from 'util'
import { fileURLToPath } from 'url'

const require = Module.createRequire(import.meta.url)
const CID = require('cids')
const { local } = require('./storage.js')
const createTypes = require('./types.js')
const mkdirp = promisify(require('mkdirp'))

const { readFile } = fs.promises
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const builtins = Module.builtinModules
const JS_EXTENSIONS = new Set(['.js', '.mjs'])

const baseURL = new URL(`${process.cwd()}/`, 'file://')

const store = local()
const types = createTypes({getBlock: store.get})
const cache = path.join(process.env.HOME, '.reg', 'deflate')

const { createWriteStream } = fs

let globals = {}

const loadPackage = async (cid, filename) => {
  const block = await store.get(cid)
  // Validate Schema
  const data = block.decode()
  const pkg = types.Package.decoder(data)
  if (!filename) {
    filename = path.join(cache, cid.toString(), 'index.js')
  }
  for (let [key, value] of Object.entries(await pkg.get('*/deps'))) {
    if (key.startswith('./') || key.startsWith('../../')) {
      // TODO: write local files to look like original dir structure
    }
    loadPackage(value)
  }
  await mkdirp(path.dirname(filename))
  const file = await pkg.getNode('*/file/data')
  const writer = createWriteStream(filename)
  for await (const chunk of file.read()) {
    writer.write(chunk)
  }
  writer.end()
  return filename
}

export async function resolve (specifier, parentModuleURL = baseURL, defaultResolve) {
  if (specifier.startsWith('@') || specifier.startsWith('@')) {
    if (specifier.startsWith('@reg/')) {
      let cid = new CID(specifier.slice('@reg/'.length))
      let f = await loadPackage(cid)
      return { url: 'file://' + f, format: 'module' }
    }
  } else {
    if (!specifier.startsWith('./') &&
        !specifier.startsWith('../') &&
        !specifier.startsWith('/')){
      throw new Error(`Unknown import: "${specifier}`)
    }
    return { url: 'file://' + specifier, format: 'module' }
    throw new Error("not implemented")
  }

  /* Fallback */
  if (builtins.includes(specifier)) {
    return {
      url: specifier,
      format: 'builtin'
    }
  }
  if (/^\.{0,2}[/]/.test(specifier) !== true && !specifier.startsWith('file:')) {
    // For node_modules support:
    // return defaultResolve(specifier, parentModuleURL);
    throw new Error(
      `imports must begin with '/', './', or '../'; '${specifier}' does not`)
  }
  const resolved = new URL(specifier, parentModuleURL)
  const ext = path.extname(resolved.pathname)
  if (!JS_EXTENSIONS.has(ext)) {
    throw new Error(
      `Cannot load file with non-JavaScript file extension ${ext}.`)
  }
  return {
    url: resolved.href,
    format: 'module'
  }
}
