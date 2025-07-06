# Meteor-Vite [Internals]

This directory contains modules that are not intended to be used by end-projects. It primarily houses utilities that 
the `jorgenvatle:vite` Meteor build plugin depends on to add a compatability between layer between the Meteor runtime
Vite.

- [`./boilerplate/Production`]
  - Injects a module import for the `clientEntry` bundle specified in `vite.config.ts`.
  - Injects stylesheets and other statically imported assets within `clientEntry`.
  - Injects a script to gradually add [preload links](https://vite.dev/guide/features.html#preload-directives-generation)
    for all remaining chunks and assets within the app's Vite bundle,
    essentially instructing the browser to eagerly cache all assets for the app in the background. This should make
    the app feel considerably more responsive for users with high-latency connections when using asynchronously
    loaded page/component chunks.
    - With `dynamicAssetBoilerplate` enabled:
      - The Vite asset HTML boilerplate is generated per-request, injecting Vite assets into the production app's main HTML responses.
    - Useful apps that use a CDN that may need to change the base URL after building the Meteor App.
  - With `dynamicAssetBoilerplate` disabled: (default) 
    - Boilerplate is statically injected into the app's main HTML file at build time.
    - Recommended to avoid having to waste resources generating a template for every incoming request.
    
- [`./boilerplate/Development`] 
  - Imports the `@vite/client` runtime for lightning fast HMR
  - Injects React's HMR preamble if React is detected within the app.
  - Injects a module import script for the app's `clientEntry` specified in `vite.config.ts`