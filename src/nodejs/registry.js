const bent = require('bent')

const main = (token, host = 'reg.mikeal.workers.dev') => {
  auth = `?GITHUB_TOKEN=${token}`
  const get = bent(`https://${host}/`, 'json')
  const put = bent('PUT', `https://${host}/`, 'json')
  const alias = async (name, pkg, version, latest = true) => {
    const body = { version, pkg, latest }
    const info = await put(name + '/_publish' + auth, body)
    return info
  }

  const pkg = async name => {
    let pkg
    try {
      pkg = await get(name + '/_pkg')
    } catch (e) {
      if (e.responseBody) {
        const body = (await e.responseBody).toString()
        e.message += `\nMessage\n${body}`
      }
      throw e
    }
    return pkg
  }
  return { alias, pkg }
}
module.exports = main
