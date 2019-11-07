const bent = require('bent')

const main = (host = 'reg.mikeal.workers.dev') => {
  const get = bent(`https://${host}/@reg/pkg/`, 'json')
  const put = bent('PUT', `https://${host}/`, 'json')
  const alias = async (name, pkg, version, latest = true) => {
    const body = { version, pkg, latest }
    const info = await put(name + '/_publish', body)
    return info
  }

  const pkg = async name => {
    const pkg = await get(name + '/_pkg')
    console.log({ pkg })
    return pkg
  }
  return { alias, pkg }
}
module.exports = main
