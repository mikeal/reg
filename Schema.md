This is the IPLD Schema for Packages.

The `File` type is from UnixFSv2 and imported from the
[`unixfsv2`](https://github.com/ipld/js-unixfsv2) module.

```sh
type Package struct {
  file &File
  deps PackageMap
}
type PackageMap {String:&Package}
```

A package is a single file of JavaScript and a map
of dependent packages. This means that a typical
project will actually be a collection of packages
that are all linked together.

The keys of `PackageMap` are the exact import strings
from the origin source file.

When a package is published the only thing alterered from
source is a replacement of the original names with
`"@rev/CID"`. The original names are the `PackageMap` key
strings.

The reason we do this is so that every individual file maintains
a hash based list of its dependencies. Without this, we
wouldn't be able to predict the dependency tree of
package files other than the index.js.

Also, it's just a bit simpler to have a unified map of import keys
to CIDs. Once the files are content addressed and put in the registry
there isn't much difference between a "local" file and a registry
package.
