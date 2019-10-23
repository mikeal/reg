const path = require('path')
const tmp = require('tmp')
const CID = require('cids')

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const store = storage(path.join(__dirname, 'cache'))

const cache = new Map()

const local = tmp.tmpDirSync()

const pull = async cid => {
  if (!CID.isCID(cid)) cid = new CID(cid)
  const root = await get(cid)
  const pkg = root.decode()
  if (!pkg.type === 'reg') {
    throw new Error(`CID is not reg package, ${cid.toString()}`)
  }
  console.log(pkg)
}
