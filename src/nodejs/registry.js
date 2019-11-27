const bent = require('bent')

const main = (host = 'reg.mikeal.workers.dev') => {
  const get = bent(`https://${host}/`, 'json')
  const put = bent('PUT', `https://${host}/`, 'json')
  const alias = async (name, pkg, version, latest = true) => {
    const body = { version, pkg, latest }
    const info = await put(name + '/_publish', body)
    return info
  }

  const pkg = async name => {
    try {
      const pkg = await info(name + '/_pkg')
    } catch(e) {
      const body = await (await e.responseBody).toString()
      e.message += `\nMessage\n${body}`
      throw e
    }
    return pkg
  }
  return { alias, pkg }
}
module.exports = main
