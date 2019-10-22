This is the IPLD Schema for Packages.

The `File` type is from UnixFSv2 and imported from the
[`unixfsv2`](https://github.com/ipld/js-unixfsv2) module.

```sh
type FileMap {String:File}

type Package struct {
  files FileMap
  deps PackageMap
}

type PackageMap {String:Package}
```


