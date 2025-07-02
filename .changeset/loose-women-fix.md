---
"meteor-vite": patch
---

Fix issue where Vite asset base URLs that include a protocol (e.g. https) would result in malformed asset URLs being added to the production app's main HTML file.
