# meteor-vite

Use [Vite](https://vitejs.dev) in your Meteor app! ⚡️

## Key features
> ⚡**Significantly speeds up Meteor's client-side build process. Uses the Vite dev server under-the-hood, leading to blazing fast hot-module-replacement during development.**

- Minimal migration steps for existing Meteor projects
- Handles lazy-loaded Meteor packages & automatic code splitting for dynamic imports
- Bring in all your favourite Vite plugins and use them together with your Meteor project.
- Simplifies a lot of the setup for things like CSS preprocessors and UI frameworks.

## Starter templates
  - [**Vue 3**](https://vuejs.org/)
    - [Example Project](/examples/vue) 
    - [Preview](https://vue--meteor-vite.wcaserver.com) 
  - [**Svelte**](https://svelte.dev/)
    - [Example Project](/examples/svelte)
    - [Preview](https://svelte--meteor-vite.wcaserver.com)
  - [**React**](https://react.dev/)
    - [Example Project](/examples/react)
    - [Preview](https://react--meteor-vite.wcaserver.com)
  - [**Solid.js**](https://www.solidjs.com/)
    - [Example Project](/examples/solid)
    - [Preview](https://solid--meteor-vite.wcaserver.com)
  - [**Meteor v3**](https://v3-migration-docs.meteor.com/)
    - [Example Project](/examples/meteor-v3-vue)
    - [Preview](https://meteor-v3-vue--meteor-vite.wcaserver.com)


## Installation

```sh
# Install meteor-vite and Vite
meteor npm i meteor-vite

# Install Vite (Meteor v3)
npm i -D vite 

# Use Vite v4 on Meteor v2
# Vite v5 dropped support for Node.js v14 which is what Meteor v2 uses internally 
# npm i -D vite@4

# Then add the Vite-Bundler package to your Meteor project.
meteor add jorgenvatle:vite-bundler
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
    // ...
  },
  "meteor": {
    "mainModule": {
      "client": "imports/entrypoint/meteor.ts",
      "server": "server/main.ts"
    },
  }
}
```

You can leave your Meteor client entry file empty, but it's necessary to enable Meteor import mode. In the example
above, we can create an empty `imports/entrypoint/meteor.ts` file.

Create a Vite configuration file (`vite.config.ts`) in your project root. And load in the `meteor-vite` plugin.
```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { meteor } from 'meteor-vite/plugin';

export default defineConfig({
    plugins: [
        meteor({
          clientEntry: 'imports/entrypoint/vite.ts',
        }),
        // Other Vite plugins here. E.g. React or Vue (See examples below)
    ],
})
```
You can then write your code from the `vite.ts` entry point and it will be handled by Vite! ⚡️

## Example with Vue 3
```js
// vite.config.ts
import { defineConfig } from 'vite'
import { meteor } from 'meteor-vite/plugin';
import vue from '@vitejs/plugin-vue'

export default defineConfig({
    plugins: [
        meteor({
          clientEntry: 'imports/entrypoint/vite.ts',
        }),
        vue(),
    ],
    // Other vite options here...
})
```

## Example with Vue 2.7
```js
// vite.config.ts
import { defineConfig } from 'vite'
import { meteor } from 'meteor-vite/plugin';
import vue from '@vitejs/plugin-vue2'

export default defineConfig({
    plugins: [
        meteor({
          clientEntry: 'imports/entrypoint/vite.ts',
        }),
        vue(),
    ],
    // Other vite options here...
})
```

## Example with React
```js
// vite.config.ts
import { defineConfig } from 'vite'
import { meteor } from 'meteor-vite/plugin';
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [
        meteor({
          clientEntry: 'imports/entrypoint/vite.ts',
        }),
        react({
            jsxRuntime: 'classic',
        }),
    ],
    optimizeDeps: {
        exclude: ['@meteor-vite/react-meteor-data'], 
    }
})
```

If your project depends on [`react-meteor-data`](https://github.com/meteor/react-packages) it might be worthwhile to 
replace it with our npm-published fork [`@meteor-vite/react-meteor-data`](https://github.com/JorgenVatle/react-packages).

The fork simply publishes the package over npm instead of Atmosphere. This has a few benefits. Primarily, Meteor 
won't try to bundle React for you, instead leaving it to Vite. This gives you more flexibility in configuring your React
environment through Vite. And a good boost in build times.

<details>
  <summary>
    Using the official `react-meteor-data` package without npm (advanced)
  </summary>
  
### React with Atmosphere's `react-meteor-data` package
> This approach is generally not the recommended as it introduces a lot of complexity in dependency tracking for code that depends on React.

If you need to use the official `react-meteor-data` package or you still want to stick with the Atmosphere version you will need to instruct Vite to externalize React, so it
isn't included twice in your client bundle.

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { meteor } from 'meteor-vite/plugin';

export default defineConfig({
    plugins: [
        react(),
        meteor({
            clientEntry: "imports/entrypoint/vite.tsx",
            // This instructs Vite to not bundle react and react-dom as they will be bundled by Meteor instead.
            externalizeNpmPackages: ['react', 'react-dom'], 
            stubValidation: {
                warnOnly: true,
                // React uses conditional exports for production and development environments
                // Meteor-Vite ignores these when preparing a stub file for externalized dependencies
                // This prevents warning messages from flooding the console when running your app.
                ignoreDuplicateExportsInPackages: ['react', 'react-dom'],
            },
            meteorStubs: {
                debug: false
            },
        })
    ],
});
```

Then in your Meteor client's `mainModule`, we need to explicitly import React to prevent the Meteor bundler from
omitting unused React components from your bundle.

```ts
// ./imports/entrypoint/meteor.ts
import 'react';
import 'react-dom';
import 'react-dom/client';
import 'react/jsx-dev-runtime';
import 'react-refresh';

import 'meteor/react-meteor-data';
```

</details>



And that should be it. Write your app from your `vite.tsx` entrypoint and enjoy lightning fast HMR ⚡

## Configuration
The only required config field is your Vite `clientEntry` field. The rest is optional and usually doesn't require
tinkering with.
```ts
// vite.config.ts
import { meteor } from 'meteor-vite/plugin';

export default defineConfig({
  plugins: [
    meteor({
      /**
       * Path to the client entrypoint for your app.
       * This becomes your new Vite-powered mainModule for Meteor.
       * @required
       */
      clientEntry: 'imports/entrypoint/vite.ts',
      
      /**
       * Skips bundling the provided npm packages if they are already provided by Meteor.
       * This assumes you have a Meteor package that depends on the provided npm packages.
       * @default []
       */
      externalizeNpmPackages: ['react', 'react-dom'],
      
      /**
       * Configures runtime validation of Meteor package stubs generated by Vite.
       * See Features section in readme for more info
       * @optional
       */
      stubValidation: {
        /**
         * list of packages to ignore export validation for.
         * @default []
         */
        ignorePackages: ['ostrio:cookies'],
        
        /**
         * Suppress warning messages when we resolve a module that has conflicting export keys.
         * This is generally only an issue for React where as we ignore conditional exports when creating an
         * ESM stub. These are only ESM export stubs that point to your Meteor bundle, so it's generally safe
         * to ignore.
         * @default []
         */
        ignoreDuplicateExportsInPackages: ['react', 'react-dom'],
        
        /**
         * Will only emit warnings in the console instead of throwing an exception that may
         * prevent the client app from loading.
         * @default false
         */
        warnOnly: true,
        
        /**
         * Set to true to completely disable stub validation. Any of the above options will be ignored.
         * This is discuraged as `warnOnly` should give you an important heads up if something might be wrong
         * with Meteor-Vite
         * @default false
         */
        disabled: false,
      },
    }),
  ],
});
```

### Meteor plugin settings
There are a couple extra advanced settings you can change through your `package.json` file under `meteor.vite`.
In most cases, you won't need to add anything here.
```json5
// package.json
{
  "name": "my-app",
  // ...
  
  "meteor": {
    "mainModule": { /* ... */ },
    
    // Additional configuration for Meteor-Vite (optional)
    "vite": {
      // If your Vite config file lives in another directory (e.g. private/vite.config.ts), specify its path here
      "configFile": "",
      
      // Replace or remove Meteor packages when bundling Vite for production.
      // This may be useful for a small subset of compiler-plugin packages that interfere with Vite's build process.
      //
      // This is only used during the Vite bundling step. The packages included in your final production 
      // bundle remains unaffected.
      "replacePackages": [
        // Removes standard-minifier packages while building with Vite. (default)
        { "startsWith": "standard-minifier", "replaceWith": "" },

        // Replace refapp:meteor-typescript with the official typescript package. (default)
        { "startsWith": "refapp:meteor-typescript", replaceWith: "typescript" },
      ]
    }
  }
}
```

## Features in-depth

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
      "client": "imports/entrypoint/meteor.ts", // Lazy loaded packages checked for and added to this file.
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
export default defineConfig({
  plugins: [
      meteor({
        stubValidation: {
            ignorePackages: ["ostrio:cookies"]
        }
      })
  ]
})
```

## Avoid imports in Meteor's client `mainModule`
Code written to or imported by your Meteor client's [`mainModule.client`](https://docs.meteor.com/packages/modules.html#Modular-application-structure) 
will not be processed by Vite, however, it will still by loaded by the Meteor client. So if you have a use case where 
you have some code that you don't want Vite to process, but still want in your client bundle, this would be the place 
to put that.

But do be careful with this - any code that's imported by both your Vite config's [`clientEntry`](#example-with-vue)
and your Meteor `mainModule.client` may lead to the code being included twice in your final production bundle.

## Compatability with [`zodern:relay`](https://github.com/zodern/meteor-relay#readme)
Since `zodern:relay` depends on a Babel plugin for processing your publication and methods on the client, we need some
extra configuration to make that work with Vite.

We have a separate Vite plugin that should take care of this for you:
- [`@meteor-vite/plugin-zodern-relay`](/npm-packages/@meteor-vite/plugin-zodern-relay#readme)
  - [View documentation](/npm-packages/@meteor-vite/plugin-zodern-relay#readme)
  - [View on npm](https://npmjs.com/@meteor-vite/plugin-zodern-relay)


## Package Details
The Vite integration comes with two dependencies that work together to enable compatibility between Meteor and Vite.

- [`meteor-vite`](/npm-packages/meteor-vite/) - Internal Vite plugin and server worker parsing and formatting Meteor packages for Vite.
    - [View changelog](/npm-packages/meteor-vite/CHANGELOG.md)
    - [View on npm](https://www.npmjs.com/package/meteor-vite)

- [`jorgenvatle:vite-bundler`](/packages/vite-bundler/) - Meteor build plugin for launching Vite workers and compiling production bundles from Vite and Meteor.
    - [View changelog](/packages/vite-bundler/CHANGELOG.md)
    - [View on Atmosphere](https://atmospherejs.com/jorgenvatle/vite-bundler)
    - [View on Packosphere](https://packosphere.com/jorgenvatle/vite-bundler)


## Roadmap
- [ ] SSR (not tested)
- [x] Meteor v3 support
    - [x] Migrate bundler from Fibers to Async/Await
    - [x] Update Meteor bundle parser to support new format introduced in v3.
- [x] Code-splitting/Dynamic imports
- [ ] Migrate intermediary production-build transpile step from Babel to esbuild.
- [ ] Automatically detect and inject React preamble into app markup.
- [ ] Add support for Vite v5
- [ ] Serve Vite bundle directly from Meteor, bypassing Meteor's build process.
  - [ ] Inject Vite module preload polyfill into the Vite client entrypoint.
  - [ ] Server-side multi-page/multi-entrypoint support.
  - [ ] Handle parsing bundle manifest when using the `--production` flag.
