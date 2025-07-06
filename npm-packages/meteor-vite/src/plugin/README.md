# Meteor-Vite [Vite Plugin]

Vite plugin enabling interoperability with Meteor.

### Plugin responsibilities
- Provide a user-friendly helper function for configuring Meteor-Vite from `vite.config.ts`
- Create ESM-compatible stubs for Meteor packages/modules by intercepting `meteor/*` imports within the user's application code:
  - Scan Meteor's local client and server bundle for modules matching the requested import path
  - Analyze and track all exports within the requested module path.
  - Yield a virtual (meteor stub) module for Vite:
    - Instantiate an in-memory Meteor module (`meteorInstall`) to get access to Meteor's module system.
    - Import all tracked exports within the requested Meteor module path.
    - Add ESM re-exports for all tracked exports within the current Meteor module path, simulating a fully valid ESM module.
    - Inject validation code into the stubbed module to provide early warnings in cases where imported symbols may be undefined or otherwise broken.
- Assign a Meteor-compatible default configuration in place of Vite's defaults:
  - Allow exposing the Vite dev server and HMR through a custom runtime.
  - Update Vite's build configuration to define custom entry modules for the server and client runtimes instead of relying Vite's `index.html` for resolving app entries.
