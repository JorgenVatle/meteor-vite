---
"meteor-vite": patch
---

Fix issue where apps without a .meteor/finished-upgraders file would cause package export analysis to fail with a file-not-found exception when building for production.
