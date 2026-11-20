---
"meteor-vite": patch
---

Speed up the package export analysis build. The temporary Meteor project now links only the npm packages that the client entry module imports, instead of the entire `node_modules` folder of the source project.
