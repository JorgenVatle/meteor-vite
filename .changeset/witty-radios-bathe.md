---
"vite-bundler": minor
---

Add support for Meteor v3 (#83)

- Refactor internal Vite dev server config store to use async collection methods rather than relying on Fibers.
- Increased minimum Meteor version requirement to v2.8.2
- Add previously missing `mongo` dependency to `package.js` dependencies.

Fixes #81 