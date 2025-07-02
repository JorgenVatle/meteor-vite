---
"meteor-vite": patch
---

Fix issue where Vite asset base URLs that include a protocol (e.g. https) would result in malformed asset URLs being added to the production app's main HTML file.

- #345
- Added one-off notice to Vite asset 404 logger with info on how to debug assets potentially not being included in the Meteor bundle.
