const createTypes = require('./types')

/*

Registry layout is simple. Every user has their own namespace
and can publish a package to that name.

/:github-username/:package-name

The registry is simply an authenticated k/v store that points
these namespaces to CIDs.

/@mikeal/bent => CID

The CID must be a valid Package.

*/

const publish = async (file, name, getBlock) => {
  const types = createTypes({getBlock})
}
publish()
