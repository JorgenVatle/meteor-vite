---
"meteor-vite": minor
"vite-bundler": minor
---

- Add Vite config option for bundling the Meteor server
- Use DDP instead of Node IPC for managing Vite Dev server status
- Prefetch all Vite production assets in the background using the lowest available link priority. 
