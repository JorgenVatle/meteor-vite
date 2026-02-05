# @meteor-vite/plugin-zodern-relay

## 2.0.0-beta.0

### Minor Changes

- 3f73d92: Move @babel/core dependency from peer dependencies to internal dependencies. This should reduce the risk of conflicts with projects that depend on other versions of Babel.
- 7a6fc25: Use Meteor-Vite constants when comparing environment names for applying zodern:relay module transform rules.

### Patch Changes

- Updated dependencies [7f46f02]
- Updated dependencies [37d7510]
- Updated dependencies [5026894]
- Updated dependencies [4f99214]
- Updated dependencies [8877164]
  - meteor-vite@3.9.0-beta.2

## 1.1.0

### Minor Changes

- 92a56a16: Infer architecture from both Vite environment context and older Vite SSR flags

## 1.1.0-alpha.0

### Minor Changes

- 92a56a16: Infer architecture from both Vite environment context and older Vite SSR flags

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
