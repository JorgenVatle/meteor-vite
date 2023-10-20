# meteor-vite

Use [Vite](https://vitejs.dev) in your Meteor app! ⚡️

## Roadmap

- [x] Development mode
- [x] Build
- [x] Importing non-core Meteor packages
- [x] Lazy meteor packages
- [x] Reify support
  - [x] Named exports
  - [x] Default exports
  - [x] Re-exports (named + wildcard)
  - [x] Re-exports via intermediary variable
- [x] Code-splitting/Dynamic imports
- [ ] SSR (not tested)
- [ ] Starter/demo templates
  - [x] [Vue 3](/examples/vue) 
    - [Live demo](https://vite-and-vue3.meteorapp.com/)
  - [x] [Svelte](/examples/svelte)
  - [x] [React](/examples/react)

## Installation

```sh
meteor add vite:bundler && meteor npm i -D vite meteor-vite
```

You can also install any vite plugin, for example `@vitejs/plugin-vue`:

```sh
meteor npm i -D @vitejs/plugin-vue
```

Make sure to have an import client entry (`meteor.mainModule.client`) in your `package.json`:

```json5
{
  "name": "my-app",
  "private": true,
  "scripts": {
    "dev": "meteor run",
    "build": "meteor build ../output/vue --directory"
  },
  "dependencies": {
    "@babel/runtime": "^7.17.9",
    "meteor-node-stubs": "^1.2.1",
    "vue": "^3.2.37"
  },
  "devDependencies": {
    "@types/meteor": "^1.4.87",
    "@vitejs/plugin-vue": "^3.0.3",
    "typescript": "^4.6.3",
    "vite": "^3.0.9"
  },
  "meteor": {
    "mainModule": {
      "client": "client/main.ts",
      "server": "server/main.ts"
    },
    // "viteConfig": "", // If you want your Vite config to live in another directory (e.g. .tools/vite.config.js), specify that here.
    "testModule": "tests/main.js"
  }
}
```

You can leave your Meteor client entry file empty, but it's necessary to enable Meteor import mode. In the example above, we can create an empty `client/main.ts` file.

Create a Vite configuration file (`vite.config.js`) in your project root:

```js
import { defineConfig } from 'vite'

// Example with Vue
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue(),
  ],
  // Other vite options here...
})
```

As we don't use a standard Vite `index.html` file, we need to specify an entry point (different from the Meteor one):

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue(),
  ],

  meteor: {
    clientEntry: 'imports/ui/main.ts',
  },
})
```

You can then write your code from this entry point and it will be handled by Vite! ⚡️

## Features

### Lazy Loaded Meteor Packages
Meteor-Vite will automatically detect lazy loaded Meteor packages and import them into your Meteor client's entrypoint.
This is necessary to ensure that the Vite bundler has access to your Meteor packages.

The imported files can safely be committed to your project repository. If you remove the associated package in the 
future, simply remove the import statement.

Our detection for these packages is fairly primitive, so it's best to keep the imports in the Meteor client 
entrypoint as specified in the `meteor.mainModule.client` field of your `package.json` file.
```json5
{
  "meteor": {
    "mainModule": {
      "client": "client/main.ts", // Lazy loaded packages are checked for and added here.
      "server": "server/main.ts"
    }
  }
}
```

### Stub validation
Runtime validation at the client is performed for Meteor packages that are compiled by Vite. This is done to avoid a 
situation where Meteor-Vite incorrectly exports undefined values from a Meteor Package. Which can lead to silently 
broken Meteor packages.

The validation is done simply through verifying that package exports do not have a `typeof` value of `undefined`.
If you do have a package that intentionally has `undefined` exports, you can disable the warning message for this 
package by excluding it in your Meteor settings.json file;
```ts
// vite.config.ts

import type { MeteorViteConfig } from 'meteor-vite'

export default defineConfig({
  // ...

  meteor: {
    clientEntry: 'imports/ui/main.ts',
    stubValidation: {
      /**
       * list of packages to ignore export validation for.
       */
      ignorePackages: ['ostrio:cookies'],

      /**
       * Will only emit warnings in the console instead of throwing an exception that may prevent the client app
       * from loading.
       */
      warnOnly: true,

      /**
       * Set to true to completely disable stub validation. Any of the above options will be ignored.
       * This is discuraged as `warnOnly` should give you an important heads up if something might be wrong with Meteor-Vite
       */
      disabled: false,
    }
  } satisfies MeteorViteConfig['meteor'],
})
```

## Package Details
The Vite integration comes with two dependencies that work together to enable compatibility between Meteor and Vite.

- [`meteor-vite`](/npm-packages/meteor-vite/) - Internal Vite plugin and server worker parsing and formatting Meteor packages for Vite.
  - [View changelog](/npm-packages/meteor-vite/CHANGELOG.md)
  - [View on npm](https://www.npmjs.com/package/meteor-vite)

- [`vite-bundler`](/packages/vite-bundler/) - Meteor build plugin for launching Vite workers and compiling production bundles from Vite and Meteor.
  - [View changelog](/packages/vite-bundler/CHANGELOG.md) 
  - [View on Atmosphere](https://atmospherejs.com/vite/bundler)
