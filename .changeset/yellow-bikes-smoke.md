---
"@meteor-vite/plugin-zodern-relay": patch
---

Fix server-side transpilation when building Meteor server with Vite. Fixes an issue where server bundles would use client stubs from babel-plugin-zodern-relay.

Related issues
- #195
- #182