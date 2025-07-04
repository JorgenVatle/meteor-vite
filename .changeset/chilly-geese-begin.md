---
"meteor-vite": patch
---

Prevent Meteor from attempting to start the Vite dev server when starting the production server bundle with a non-production NODE_ENV variable.

- Fixes (which wasn't fully resolved) #286
