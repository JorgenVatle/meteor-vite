---
"jorgenvatle:vite": patch
---

Fix issue where starting the Meteor dev server with just 'meteor' would sometimes cause the Meteor-Vite build plugin to be disabled if arguments like '--raw-logs' are passed.
