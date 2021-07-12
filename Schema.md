# `reg` IPLD Schema

This is the [IPLD Schema](https://specs.ipld.io) for `reg` Packages.

The `File` type is from UnixFSv2 (next-generation
data structures for IPFS). In this implementation
of `reg` the UnixFSv2 implementation is imported from the
[`unixfsv2`](https://github.com/ipld/js-unixfsv2) module.

```sh
type Module struct {
  file &File
  deps PackageMap
  builtins optional [String]
}
type Exports struct {
  default Module
  node optional Module
  browser optional Module
}
type PackageV1 struct {
  exports Exports
  tests Module
}
type PackageMap {String:&PackageV1}
type Package union {
  | PackageV1 "v1"
} representation keyed
```

At a basic level, a package is a data structure for
a single file. It can export different files for
different platforms (nodejs, browser) and may contain
other useful metadata (required builtins, tests, etc).

Each file also has statically linked dependencies.
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
