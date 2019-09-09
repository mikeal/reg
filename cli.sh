#!/bin/sh

BASEDIR=$(dirname "$0")

exec /usr/bin/env node --no-warnings --experimental-modules --loader $BASEDIR/lib/nodejs-loader.mjs $BASEDIR/lib/cli.js "$0" "$@" 

