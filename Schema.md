# `reg` IPLD Schema

This is the [IPLD Schema](https://specs.ipld.io) for `reg` Packages.

The `File` type is from UnixFSv2 (next-generation
data structures for IPFS). In this implementation
of `reg` the UnixFSv2 implementation is imported from the
[`unixfsv2`](https://github.com/ipld/js-unixfsv2) module.

```sh
type PackageV1 struct {
  file &File
  deps PackageMap
}
type PackageMap {String:&Package}
type Package union {
  | PackageV1 "v1"
} representation keyed
```

A package is a single file of JavaScript and a map
of dependent packages. This means that a typical
project will actually be a collection of packages
that are all linked together.

The keys of `PackageMap` are the exact import strings
from the original source file.

The linker is responsible for replacing the original
registry package references (`@mikeal/test/1.0.0`)
in the source file with references to the hash linked
version of the file root file (`@reg/${CID}.js`).
The original names are then used as the `PackageMap` key
strings.

The reason we do this is so that every individual file maintains
a hash based list of its dependencies. Without this, we
wouldn't be able to predict the dependency tree of
package files other than the index.js.

Also, it's just a bit simpler to have a unified map of import keys
to CIDs. Once the files are content addressed and put in the registry
there isn't much difference between a "local" file (`./src/file.js`)
and a registry package (`@mikeal/test/1.0.0`).
