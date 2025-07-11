# Meteor-Vite [Server Entry Modules]

Internal entry-modules for the Meteor server.

- [`development`](development.ts)
  - Initialize the Vite Dev Server to serve modules and assets to clients with Vite-powered HMR
  - Inject entry scripts and assets into the Meteor app's HTML boilerplate
  - Create a Vite-powered module runner environment for running server-side code with Vite's HMR and module system.
  - Initialize server-side HMR
- [`hmr`](hmr.ts)
  - Add Meteor-compatability HMR hooks to handle resets for Meteor code with side effects. (`new Mongo.Collection()`, `Meteor.publish(...)`, etc.)
- [`production`](production.ts)
  - Scan Meteor and Vite's client manifests
  - Mark Vite assets as cacheable
  - Add middleware to Meteor's WebApp for serving Vite assets and handling 404 requests.
  - Add Meteor boilerplate hooks to inject scripts and other assets from Vite's production bundle into the production app's main HTML responses.