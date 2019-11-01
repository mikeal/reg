#!/bin/sh

BASEDIR=$(dirname "$0")

exec /usr/bin/env node --no-warnings --experimental-modules --loader $BASEDIR/src/nodejs/loader.mjs "$@"
