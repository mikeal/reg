# `reg` - Native ESM Package Management

`reg` is a package manager for native ES Modules. It's
built to enable dependency management for Universal JavaScript
(JavaScript that can run in the Browser and in Node.js w/o a compiler).

**This library is highly experimental and still likely to break without
notice. DO NOT USE THIS IN PRODUCTION.**

Supporting Universal JavaScript is quite difficult as the Browser's
module system has a very unique set of constraints. In order to build
effective dependency management on-par with the features you'd expect
from `npm` the approach `reg` takes is radically different.

`reg` statically links the dependency tree by hash reference, re-writing
the import statements of the output files (this is the **only** alteration to
your source file `reg` does, it is not a compiler). A package registry
is then just a namespace that maps users, package names, and versions to
specific package hashes. You can then directly import the resulting package
references in a Browser or in Node.js with a special loader.

**Note: since this is built for Universal JavaScript, you cannot use any
of the Node.js standard library or any packages from `npm` since none
of this is available in Browsers without a compiler.**

## CLI

### `reg input-file.js`

This command takes an input file, statically links the dependency tree,
stages it in a local cache and executes the input file.

### `reg @mikeal/test/1.0.0`

The same command can also take a package reference from the registry.

### `reg publish <filename> <name> <semver>`

Publish an input file to a package to the registry.

```
Positionals:
    filename  Filename of script to run. Example `reg input.js`
    semver    Package version number.

    Options:
      --help     Show help
      --version  Show version number
      --token    GitHub personal access token
                 Defaults to process.env.GHTOKEN || process.env.GITHUB_TOKEN
```

Note that this command requires a GitHub Token that only needs enough permissions
to validate the user, no write or read access to any of your repositories are
required.

All package names must be proceeded by the user's GitHub username. There are currently
no top level packages.

## Developer CLI

There are several more commands that have been useful while developin this
software. They may eventually be removed from the public API.

```
Run a local script file in reg

Commands:
  cli.js stage <filename>                   Run the linker and stage the tree in
                                            local cache
  cli.js linker <filename>                  Run the static linker
  cli.js info <name>                        Get info for named alias
  cli.js cat <name>                         Print the file data for the named
                                            alias
  cli.js pkg-info <cid|name>                Get package information
```

## Data Model

`reg` implements a data model for its package data that is similar to
`git` in many ways. The highlights of this data structure are:

* Optimized for offline, sync, and decentralization (just like git!)
* A module is only a single file (the Browser requires this) with the
dependency tree attached.
* Every module gets a unique hash (like a git commit) which means
cache de-duplication works across differing module names and version.
* Every file is chunked with an algorithm called Rabin which creates
good block boundaries for diffing (this is what rsync uses). This
gives us sub-file de-duplication in cache which is especially
useful for de-duplicating file parts between versions.

This data structure also enables some important HTTP/2 features
we need in order to be competitive with bundle performance.

* HTTP/2 Push for all of the dependencies required by a single import.
* If an old e-tag is presented for a module, `reg` can diff the two
dependency trees and use HTTP/2 Push of **only the assets that have
changed**.

For a more detailed look at the data structure you can read 
[the schema](./Schema.md).

Some visual examples follow:

![IMG_0306](https://user-images.githubusercontent.com/579/70022957-d562b300-154a-11ea-8b45-fee33f8316a7.jpeg)

![IMG_0307](https://user-images.githubusercontent.com/579/70022968-dd225780-154a-11ea-864c-868983eace65.jpeg)

![IMG_0308](https://user-images.githubusercontent.com/579/70022981-e3183880-154a-11ea-97e0-3c02b7f47554.jpeg)

![IMG_0309](https://user-images.githubusercontent.com/579/70022985-e8758300-154a-11ea-9f47-14fcdc363155.jpeg)

![IMG_0310](https://user-images.githubusercontent.com/579/70023075-2c688800-154b-11ea-9584-75e6904bdce2.jpeg)

![IMG_0311](https://user-images.githubusercontent.com/579/70023088-2ffc0f00-154b-11ea-9e35-f77574fb3600.jpeg)
