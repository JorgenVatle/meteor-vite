# meteor-vite

## 3.4.0

### Minor Changes

- f136fd83: Re-implement assetsDir and assetsBaseUrl plugin options from Meteor-Vite v2.

  - Addresses an issue where the `assetsBaseUrl` and `assetsDir` meteor-vite plugin options from previous versions of Meteor-Vite are ignored.
  - Fixes an issue where Vite's `base` URL is always overriden by meteor-vite.

  ### Issue references

  - Fixes https://github.com/JorgenVatle/meteor-vite/issues/296
  - Fixes https://github.com/JorgenVatle/meteor-vite/issues/271

## 3.3.2

### Patch Changes

- 64865d95: Use absolute URLs for dev server Vite entry snippets

## 3.3.1

### Patch Changes

- 2dffe083: Catch and log exceptions during server render appendToBody calls in the client. Workaround for hoisting issue in Cordova environments.

## 3.3.0

### Minor Changes

- 5082a594: Use `meteor/server-render` instead of WebAppInternals for rendering Vite module markup

  - Load Vite HTML snippets client-side when running in Cordova.
    - Addresses https://github.com/JorgenVatle/meteor-vite/issues/280

### Patch Changes

- 233ccb1d: Fix issue where projects without a devDependencies field in `package.json` would cause a runtime TypeError.

## 3.2.1

### Patch Changes

- 56b7b000: Disable old stub template caching when running in simulated production mode (`meteor run --production`)

  Fixes:

  - https://github.com/JorgenVatle/meteor-vite/issues/283

## 3.2.0

### Minor Changes

- 689c8cb7: Default configuration improvements

  - Disable debug logs by default in production

    - https://github.com/JorgenVatle/meteor-vite/issues/275

  - Disable stub validation warnings for packages with known undefined exports
    - https://github.com/JorgenVatle/meteor-vite/issues/246

- 0bdafcff: Add plugin option for exposing source maps through the Meteor WebApp in production.

### Patch Changes

- 493a0bd4: Normalize generated import paths to address bad import paths on Windows.

  - https://github.com/JorgenVatle/meteor-vite/issues/281

- 41837c35: Place .gitignore file for temporary Vite bundle modules in temp dir root instead of the parent directory of the server entry. Addresses a concern where these temporary files might get accidentally commited into version control.

## 3.1.2

### Patch Changes

- 37cd1228: Use package.json instead of global variable for determining current version of jorgenvatle:vite

## 3.1.1

### Patch Changes

- 7f19e6c9: Emit an informational exception if Meteor build plugin is missing a client entry module runtime setting. Addresses an issue where updating meteor-vite without updating the build plugin to a version where version validation was added.
  - Added missing `semver` package to dependencies.

## 3.1.0

### Minor Changes

- e0b26ddf: Inject module preload polyfill in client entrypoints unless explicitly disabled in Vite config.
  - Use built-in Vite error overlay when stub validation fails
  - Validate that versions for `meteor-vite` and the `jorgenvatle:vite` build plugin are compatible.

### Patch Changes

- 910e16f5: Emit warning message when using deprecated Vite plugin configuration format.
  - https://github.com/JorgenVatle/meteor-vite/issues/247#issuecomment-2513052765

## 3.0.1

### Patch Changes

- 2c15e6a0: Fix issue where meteor-vite would not be loaded with apps not using the experimental [`serverEntry`](https://github.com/JorgenVatle/meteor-vite/blob/54005deb4da08cbdafd7a31739c60ff223c8c2ee/README.md#configuration) option for building the Meteor server with Vite.

  - Addresses the blank screen issue mentioned in #246

  Add server-side HMR handlers for `meteor/ejson` and `SyncedCron`.

## 3.0.0

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

- f6a46b63: Disable Meteor package stubs when building for the server. This addresses some strange context issues with packages like redis-oplog when using stubs in intermediary server server bundle. The stubs are really only necessary in the server runtime environment, so this should be the safest way to build anyway.

### Patch Changes

- f31a8202: Fix builds: disable incompatible Meteor build plugins on startup
- 93bd49cbd: Fall back to importing from package root if subpath import fails. This is a temporary fix to address server compatability as the package parser currently only scans for exports in web.browser.
- bd1e74ac1: Use global Package object as base for Meteor module stubs
- 12398cb3: Hotfix WebApp handler response call order and set an explicit content-type header for invalid Vite asset requests
- dbff7d86: Include hash in entry module filenames. Addresses a critical issue where older entry modules would be kept (almost) indefinitely by client and edge caches.
- d26c47e1: Remove misplaced debug logger and expand information provided with unrecognized module method warnings.
  - Fix issue where Meteor package stubs would try to import directly from packages' full mainModule path (e.g. `meteor/ostrio:cookies/main.js`) rather than using the actually requested module path (e.g. `meteor/ostrio:cookies`). Resolves some issues where some package exports would show up as not found or undefined.
- e80538d2: Disable 'keepNames' feature from ESBuild - it appears to cause issues with downstream Meteor builds
- 86c0474c: Fix call order for production Vite asset 404 middleware

## 3.0.0-alpha.9

### Patch Changes

- dbff7d86: Include hash in entry module filenames. Addresses a critical issue where older entry modules would be kept (almost) indefinitely by client and edge caches.

## 3.0.0-alpha.8

### Patch Changes

- 12398cb3: Hotfix WebApp handler response call order and set an explicit content-type header for invalid Vite asset requests

## 3.0.0-alpha.7

### Patch Changes

- 86c0474c: Fix call order for production Vite asset 404 middleware

## 3.0.0-alpha.6

### Minor Changes

- f6a46b63: Disable Meteor package stubs when building for the server. This addresses some strange context issues with packages like redis-oplog when using stubs in intermediary server server bundle. The stubs are really only necessary in the server runtime environment, so this should be the safest way to build anyway.

## 3.0.0-alpha.5

### Patch Changes

- e80538d2: Disable 'keepNames' feature from ESBuild - it appears to cause issues with downstream Meteor builds

## 3.0.0-alpha.4

### Patch Changes

- d26c47e1: Remove misplaced debug logger and expand information provided with unrecognized module method warnings.
  - Fix issue where Meteor package stubs would try to import directly from packages' full mainModule path (e.g. `meteor/ostrio:cookies/main.js`) rather than using the actually requested module path (e.g. `meteor/ostrio:cookies`). Resolves some issues where some package exports would show up as not found or undefined.

## 3.0.0-alpha.3

### Patch Changes

- f31a8202: Fix builds: disable incompatible Meteor build plugins on startup
- bd1e74ac: Use global Package object as base for Meteor module stubs

## 3.0.0-alpha.2

### Patch Changes

- 93bd49cb: Fall back to importing from package root if subpath import fails. This is a temporary fix to address server compatability as the package parser currently only scans for exports in web.browser.

## 3.0.0-alpha.1

### Patch Changes

- 9f657993: Pre-release for Vite v6 rewrite. Adds lightning fast server-side HMR

## 2.0.0

### Major Changes

- 8010d5c1a: Serve Vite bundle directly as static assets in production.
  Skipping the Meteor bundling/transpilation steps for significantly faster build and client load times. ⚡

  Upgrading to `v3` shouldn't require any changes to your application. But there are some changes that could potentially impact your users.

  - Most of your application assets will be served from `/vite-assets/<chunkFileName>.<css | js>`
    - If you're using a CDN and serve your app under multiple hostnames, you might want to load those assets from one host instead of relative to the current host. This can be done by setting `assetsBaseUrl` in your `meteor-vite` plugin config.
    - Static assets served by Meteor does not have any CORS headers. You will have to apply these on your web server or use a CloudFlare transform rule if you're using a static host for your assets.
  - [Browser support for ESM](https://caniuse.com/?search=ESM) is required. Global support is around 97% at the time of writing.

### Minor Changes

- f2e0e9d2: - Add Vite config option for bundling the Meteor server
  - Use DDP instead of Node IPC for managing Vite Dev server status
  - Prefetch all Vite production assets in the background using the lowest available link priority.
- 436fd5bc: Use ESBuild instead of Vite's SSR bundler for Meteor server bundle.

### Patch Changes

- f597f099: Fix environment passthrough to Vite
- e743310e: Use any available IPC interface for workers instead of relying on one transport strategy
- 5e669858: Update serverEntry config option to use Vite SSR build internally
- 079d1d7c6: Use Vite plugin configuration instead of build-time environment variables for setting the base path and URL for assets
- 8499c6a6: Loosen peer dependency requirement for Vite to allow for use with Vite v5

## 1.12.1

### Patch Changes

- 32c6ee64: Use any available IPC interface for workers instead of relying on one transport strategy

## 1.12.0

### Minor Changes

- 92ce6b41: Build `serverEntry` bundles using Vite's SSR build process instead of using an inline browser build config.

  - Resolves some of the configuration necessary to get the new server builds to work correctly. Default settings should now work for most users.
  - SSR with Meteor can now be done entirely through Vite's build system.
  - Import aliases no longer need to be defined in a Babel config if you intend to use them in server code.

  #### SSR example

  - See the new [Vue + SSR](/examples/vue-ssr) example app to see it in action. Or check the [live preview](https://vue-ssr--meteor-vite.wcaserver.com)!

  #### Related issues

  - #195
  - #215

  Related release notes: https://github.com/JorgenVatle/meteor-vite/releases/tag/vite-bundler%402.1.2

## 1.11.2

### Patch Changes

- 9f986bde: Add failsafe for experimental serverEntry feature.

## 1.11.1

### Patch Changes

- 4d92b722: Allow Vite dev server to run without a DDP connection.
  - Fix Meteor DDP URL parsing from Meteor runtime environment. Falls back to using `MOBILE_DDP_URL`.
  - Fix #208

## 1.11.0

### Minor Changes

- 77ab5688: Refactor IPC between Meteor and the Vite Dev Server to use DDP whenever possible.

  - Updated peer dependency for Vite to allow Vite v5. Meteor v2 users still need to use Vite v4 as v5 dropped support for Node v14 - the Node.js version used by Meteor v2.

  ### Build Meteor Server with Vite (experimental)

  Added an option to bundle the Meteor server with Vite. Bundles all your server assets into a single module before
  passing it onto the Meteor compiler. This should significantly reduce the load on Meteor's dependency tracker, leading
  to much faster time-to-restart times in development.

  Also comes with the added flexibility provided by Vite and its plugin ecosystem. Lets you take full control over what
  code is imported on the server and how it's transformed.

  ```ts
  // vite.config.ts
  export default defineConfig({
    plugins: [
      meteor({
        clientEntry: "./client/main.vite.ts",
        serverEntry: "./server/main.vite.ts", // Write your server code from this entrypoint.
      }),
    ],
  });
  ```

  ```json5
  // package.json
  {
    meteor: {
      mainModule: {
        client: "./client/main.meteor.js",
        // Create an empty main.meteor.js file in your server directory.
        // This will be populated with your final Vite-built server bundle.
        server: "./server/main.meteor.js",
      },
    },
  }
  ```

  ### Compatability Notes

  - `jorgenvatle:vite-bundler` now requires `meteor-vite@ >= v1.11.0`.
  - This release only affects development builds. But it now assumes your development server is accessible locally over
    DDP. If you bind Meteor to an IP address that for some reason is not accessible to other processes, you may run into
    issues where the Vite Dev server won't start.

  ### Resolves issues

  - #195
  - #179

## 1.10.4

### Patch Changes

- 0fbb978b: Prevent Atmosphere packages' node dependencies from affecting the parent package's name and entry module

## 1.10.3

### Patch Changes

- 777543ec: Update to handle the new parameter format for Meteor V3 release candidate's package registration queue. Should addess the issue mentioned on the Meteor forums: https://forums.meteor.com/t/meteor-3-0-rc-0-is-out/61515/9

## 1.10.2

### Patch Changes

- 9a770a44: Use ViteDevServer's resolvedUrls as the default for the Meteor client HTTP module entrypoint

## 1.10.1

### Patch Changes

- 5f19a295: Use the configured Vite client entrypoint as the default entrypoint for Vite dependency optimization.

  - Fixes #128

## 1.10.0

### Minor Changes

- 60491ff6: Add support for externalizing imports for npm packages bundled with Meteor

  - Allows you to point Vite to the Meteor bundle for some or all imports of an npm package.
    In most cases, you don't need to use this feature, but if you're using Meteor packages that
    have peer npm-dependencies, you can avoid the dependency being included twice in your final
    production bundle by hinting to Vite that this npm dependency is provided by Meteor.

  ```ts
  import React from "react"; // This will import from your node_modules

  // If you have a Meteor package that depends on React, then React will already be
  // in your Meteor client bundle. So you can instruct Vite to not import from node_modules
  import React from "meteor:react"; // This will import from your Meteor bundle
  ```

  - Fixes #33

## 1.9.1

### Patch Changes

- 1980ff5e: Check for METEOR_LOCAL_DIR environment variable when preparing the default meteor-vite plugin config.

  - Fixes #116
  - Fixes https://github.com/Akryum/meteor-vite/issues/46

## 1.9.0

### Minor Changes

- 3101e1a: Add support for Meteor v3.0-beta.0

  - Fixes #81

### Patch Changes

- 40edd14: Fix internal type for Package.json `tempBuildDir` configuration option

## 1.8.0

### Minor Changes

- 394ad2e: Update configuration options

  - Move advanced vite-bundler settings in `package.json` under `meteor.vite`.
  - Add option to customize Rollup chunk filenames in plugin config.

## 1.7.3

### Patch Changes

- c365435: Increase chunk hash length to 12 to address Vite warnings for large projects

  - Fixes #77

## 1.7.2

### Patch Changes

- f35f6c6: Use shortened file hashes over .chunk suffix for Vite build output.

## 1.7.1

### Patch Changes

- e55afeb: Tag Vite chunks to prevent the Meteor compiler plugin from interfering with server module bundling.

## 1.7.0

### Minor Changes

- 12fb8c5: Use Vite plugin config to customize the intermediary directory for the Vite bundle before it's sent to Meteor

## 1.6.0

### Minor Changes

- 9bd104d: Add option to configure Meteor-Vite though a Vite plugin rather than as a top-level property in the Vite user config.

## 1.5.0

### Minor Changes

- dbc9be4: Use temporary file in `meteor-vite` npm package to feed Vite bundle into Meteor for production.

  - Run build cleanup before creating a new Vite bundle.
  - Default Meteor stub validator to warnOnly when running in production mode.
  - Add SolidJS example app

  Fixes #34
  Fixes Akryum/meteor-vite#33
  Fixes meteor/meteor#12594

  ***

## 1.4.1

### Patch Changes

- 01795bc: Store info file for Vite dev server background worker in .meteor/local to prevent the file from being accidentally committed into version control by package users.

## 1.4.0

### Minor Changes

- 1ce04c9: Keep Vite dev server running between Meteor restarts (Fixes #35)

## 1.3.2

### Patch Changes

- d883954: Read Isopack metadata from global Meteor package cache

  Fixes #26

## 1.3.1

### Patch Changes

- 835dbd5: Fix package re-exports being re-exported once more within the Meteor stub template

## 1.3.0

### Minor Changes

- 9bcd19f: - Update MeteorStubs plugin error handler to emit errors when a Meteor client entrypoint isn't specified
  - Wrap MeteorStubs plugin around plugin setup helper function to catch and format exceptions whenever possible

## 1.2.2

### Patch Changes

- 3367848: Update internal communication between the Vite server worker and Meteor.

  Add fallback method for clients waiting on Vite server configuration from Meteor.

  Allow Vite config files to be stored outside of the project's root directory through package.json configuration. Details should be added to the README.

## 1.2.1

### Patch Changes

- 9b26de5: Update parser to eagerly parse and export all available exports for a given Meteor package

## 1.2.0

### Minor Changes

- 00a3567: - Migrate Vite stub validation configuration from Meteor's `settings.json` to Vite config.
  - Update exception names for stub validation
  - Add an option to stub validation where you can toggle it on or off entirely.

## 1.1.1

### Patch Changes

- c22937e: Fix error handling for non-MeteorVite errors

## 1.1.0

### Minor Changes

- 662a820: - Fixed an issue where Meteor builds with lazy-loaded packages would only work if Meteor had been run at least once in development mode.
  - Fixed an issue where some lazy-loaded packages would cause the Vite dev server to become unresponsive
  - Updated Vite dev server loggers.
