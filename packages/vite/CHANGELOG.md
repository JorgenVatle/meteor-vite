# jorgenvatle:vite

## 1.5.2

### Patch Changes

- e329593: Fix dynamic boilerplate check for production and development builds

## 1.5.1

### Patch Changes

- f1ff3b41: Patch potentially broken release bundle

## 1.5.0

### Minor Changes

- 26d77f17: Fix internal build process where parts of the meteor-vite package would be bundled into the package instead of loaded from the peer project's node_modules.
  - Fixes #286

### Patch Changes

- 6e9d347f: Use consistent colorization for build plugin logs.

## 1.4.2

### Patch Changes

- 575857ca: Test releases using Meteor package name format

## 1.4.1

### Patch Changes

- a00ccb27: Hotfix dynamic asset boilerplate check being inverted where the option would be disabled when enabled. Causing development builds to result in a white screen of death.

## 1.4.0

### Minor Changes

- e3950b4f: Add option to dynamically generate Vite asset boilerplate. Fixes #316

## 1.3.6

### Patch Changes

- b9ad34e1: Remove redundant warning message for multiple boilerplate inclusion attempts during build.

  - Use Vite asset paths relative to the current host when no ROOT_URL or CDN_URL is set for the app.

## 1.3.5

### Patch Changes

- 48439db7: Remove filename requirement for Vite HTML boilerplate compiler

## 1.3.4

### Patch Changes

- 8aa1ff9c: Fix issue where Vite config files in node_modules would trigger Vite boilerplate injection into client app leading to the boilerplate being omitted/tree-shaken out of the app unless imported explicitly.

## 1.3.3

### Patch Changes

- 56b21de1: Handle Vite configs with .mts and .mjs file extensions

## 1.3.2

### Patch Changes

- 4bfbb9a5: Fix typo in arch conditional causing boilerplate to target servers instead of clients.

## 1.3.1

### Patch Changes

- 7c62f38f: Fix issue where client HTML boilerplate would only be added to the web.browser arch.

## 1.3.0

### Minor Changes

- 9202100f: Prepare client HTML boilerplate during build time instead of generating it with each incoming request. This should also address Vite not being initially included in Cordova builds.

## 1.2.0

### Minor Changes

- f136fd83: Re-implement assetsDir and assetsBaseUrl plugin options from Meteor-Vite v2.

  - Addresses an issue where the `assetsBaseUrl` and `assetsDir` meteor-vite plugin options from previous versions of Meteor-Vite are ignored.
  - Fixes an issue where Vite's `base` URL is always overriden by meteor-vite.

  ### Issue references

  - Fixes https://github.com/JorgenVatle/meteor-vite/issues/296
  - Fixes https://github.com/JorgenVatle/meteor-vite/issues/271

## 1.1.2

### Patch Changes

- e9bca4cb: Prevent call stack recursion for internal Meteor boilerplate method

## 1.1.1

### Patch Changes

- f1f8b590: Fix bad meteor/server-render client module stub

## 1.1.0

### Minor Changes

- 5082a594: Use `meteor/server-render` instead of WebAppInternals for rendering Vite module markup

  - Load Vite HTML snippets client-side when running in Cordova.
    - Addresses https://github.com/JorgenVatle/meteor-vite/issues/280

## 1.0.4

### Patch Changes

- 705a3d51: [Release] Rewrite package name after release to use consistent naming for releases on GitHub

## 1.0.3

### Patch Changes

- 37cd1228: Use package.json instead of global variable for determining current version of jorgenvatle:vite

## 1.0.2

### Patch Changes

- c875e845: Add client entry module to runtime config
  - Bind package version to build plugin context

## 1.0.1

### Patch Changes

- 930ca173: Hotfix for previous major release published using an out-of-date build plugin version

## 1.0.0

### Major Changes

- 9f6579934: Upgrade to Vite v6

  ### ⚡ Added lightning fast server-side HMR through Vite's new Environments API

  - Vite can now take over the entire build process for the your Meteor server code. This is an improved iteration of the `serverEntry` option introduced in [`jorgenvatle:vite-bundler@2.1.0`](https://github.com/JorgenVatle/meteor-vite/releases/tag/vite-bundler%402.1.2)
    - It does not require any intermediary pre-bundling step and is done at runtime.
    - Changes you make to server code benefit from the same near-instant HMR that you get on the client.
    - Your Meteor server no longer needs to restart in-between changes you make changes to it.
  - Vite now runs as a part of the Meteor runtime.
    - HMR and assets are served through Meteor's own web server, dropping the need to manage more than one host in development. Should make things a lot easier to deal with if you need to expose the dev server to the local network, particularly for Cordova.
  - In production, the same changes from https://github.com/JorgenVatle/meteor-vite/pull/173 apply. Your assets are built and served as static files without the need for pushing them through Meteor's build system.
  - Client assets benefit from code splitting. What's not immediately required on first page load will be prefetched quietly in the background by the browser.

  ### Server HMR

  Building the Meteor server with Vite is still in its experimental phase. To provide HMR for the server, modules with side-effects need to be cleaned up between changes. Currently we clear out your method and publication handlers between updates to prevent `Mongo.Collection` from yelling at you for defining/instantiating them twice. But there likely is a list of other things that might be other things that need to be cleaned up between reloads. Looking forward to any feedback on this.

  If you run into issues, you can always just comment out the `serverEntry` field in your Vite config and it should behave just like previous versions of Meteor Vite.

  ## Migration steps

  `jorgenvatle:vite-bundler` has been renamed to `jorgenvatle:vite`.

  ```sh
  # Upgrade Vite and Meteor-Vite
  meteor npm i vite@6
  meteor npm i meteor-vite@3

  # Upgrade Meteor build plugin
  meteor remove jorgenvatle:vite-bundler
  meteor add jorgenvatle:vite
  ```

  ## Breaking changes

  - Since Vite v5, support for Node.js v14 was dropped. Since this release depends on Vite v6, Meteor v2 support is no longer possible.

### Minor Changes

- d45e887c: Bump pre-release tag to avoid accidentally published v1 release from taking precedence

### Patch Changes

- f31a8202: Fix builds: disable incompatible Meteor build plugins on startup
- 60c83997: Wrap dev server bootstrapper around Meteor.startup hook. Workaround for issue where changes to Meteor.settings.public aren't sent to clients. Ref: https://github.com/meteor/meteor/issues/13489
- e80538d2: Disable 'keepNames' feature from ESBuild - it appears to cause issues with downstream Meteor builds

## 1.1.0-alpha.1

### Patch Changes

- e80538d2: Disable 'keepNames' feature from ESBuild - it appears to cause issues with downstream Meteor builds

## 1.1.0-alpha.0

### Minor Changes

- d45e887c: Bump pre-release tag to avoid accidentally published v1 release from taking precedence

## 1.0.0-alpha.3

### Patch Changes

- 60c83997: Wrap dev server bootstrapper around Meteor.startup hook. Workaround for issue where changes to Meteor.settings.public aren't sent to clients. Ref: https://github.com/meteor/meteor/issues/13489

## 1.0.0-alpha.2

### Patch Changes

- f31a8202: Fix builds: disable incompatible Meteor build plugins on startup

## 1.0.0-alpha.1

### Patch Changes

- 9f657993: Pre-release for Vite v6 rewrite. Adds lightning fast server-side HMR
