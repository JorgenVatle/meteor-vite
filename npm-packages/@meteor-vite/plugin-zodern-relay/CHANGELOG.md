# @meteor-vite/plugin-zodern-relay

## 1.0.6

### Patch Changes

- eed4b4d1: Fix server-side transpilation when building Meteor server with Vite. Fixes an issue where server bundles would use client stubs from babel-plugin-zodern-relay.

  Related issues

  - #195
  - #182

## 1.0.5

### Patch Changes

- b2f8b9bb: Fix forked versions of zodern:relay: Adds a workaround for hardcoded zodern:relay/client import paths added by the Babel transformer.

## 1.0.3

### Patch Changes

- bfc6f0e7: Include Babel Typescript preset in transformer plugin.

## 1.0.2

### Patch Changes

- 3f0d4891: Compile zodern:relay publications/methods with official Babel plugin.

  - #132
