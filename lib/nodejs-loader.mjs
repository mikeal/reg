import path from 'path'
import process from 'process'
import Module from 'module'

import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const builtins = Module.builtinModules
const JS_EXTENSIONS = new Set(['.js', '.mjs'])

const baseURL = new URL(`${process.cwd()}/`, 'file://')

export function resolve (specifier, parentModuleURL = baseURL, defaultResolve) {
  if (specifier.startsWith('../')) {
    console.log({specifier, parentModuleURL})
    const url = new URL(`${__dirname}/../test/fixture/registry/main.js`, 'file://')
    return { 
      url: url.href, 
      format: 'module'
    }
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
